'use client';
import { useEffect, useState, useRef } from 'react';
import './globals.css';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

interface SharedUrl {
    id: number;
    title: string;
    url: string;
    createdAt: string;
}

export default function Home() {
    //hook
    const [urls, setUrls] = useState<SharedUrl[]>([]);
    const [password, setPassword] = useState('');
    //他のuseState
    const [inputPassword, setInputPassword] = useState('');
    const [authorized, setAuthorized] = useState(false);
    const [error, setError] = useState('');
    const [keyword, setKeyword] = useState('');
    const [lastModified, setLastModified] = useState<string | null>(null);
    const lastModifiedRef = useRef<string | null>(null);
    const [urlCount, setUrlCount] = useState<number>(0);
    const urlCountRef = useRef(0);

    useEffect(() => {
        urlCountRef.current = urlCount;
        lastModifiedRef.current = lastModified;
    }, [urlCount, lastModified]);

    function updateMeta(res: Response) {
        const newLastModified = res.headers.get("Last-Modified");
        const newUrlCount = Number(res.headers.get("X-Url-Count") || "0");
        // メタデータを更新
        setLastModified(newLastModified);
        lastModifiedRef.current = newLastModified;
        setUrlCount(newUrlCount);
        urlCountRef.current = newUrlCount;
    }

    // ログイン処理
    function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        fetch(`${basePath}/api/urls`, {
            headers: {
                authorization: `Bearer ${inputPassword}`
            }
        })
            .then(res => {
                if (!res.ok) throw new Error('認証エラー');
                const newLastModified = res.headers.get("Last-Modified");
                const newUrlCount = Number(res.headers.get("X-Url-Count") || "0");
                updateMeta(res);
                return res.json();
            })
            .then(data => {
                setPassword(inputPassword);
                setAuthorized(true);
                setUrls(data);
            })
            .catch(() => setError('認証に失敗しました'));
    }

    // URLリストを取得
    const fetchUrls = () => {
        fetch(`${basePath}/api/urls`, {
            headers: {
                authorization: `Bearer ${password}`,
                ...(lastModifiedRef.current ? { "If-Modified-Since": lastModifiedRef.current } : {}),
                ...(urlCountRef.current ? { "X-Url-Count": urlCountRef.current.toString() } : {}),
            }
        })
            .then(res => {
                if (res.status === 304) return null;
                if (!res.ok) throw new Error('認証エラー');
                updateMeta(res);
                return res.json();
            })
            .then(data => {
                if (data) setUrls(data);
            })
            .catch(() => setError('パスワードが違います'));
    };

    // 削除
    async function handleDelete(id: number) {
        if (!window.confirm("削除しますか？")) return;
        try {
            await fetch(`${basePath}/api/delete?id=${id}`, {
                method: 'DELETE',
                headers: {
                    authorization: `Bearer ${password}`
                }
            });
            fetchUrls();
        } catch {
            setError('削除に失敗しました');
        }
    }

    // TSV形式でダウンロード
    function downloadTsv() {
        const header = ['Date', 'Title', 'URL'];
        const rows = urls.map((u: any) => [
            new Date(u.createdAt).toLocaleString(),
            u.title.replaceAll('\t', ' '),
            u.url
        ]);
        const tsv = [header, ...rows].map(r => r.join('\t')).join('\n');
        const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'shared_urls.txt';
        a.click();

        // オブジェクトURLを解放
        URL.revokeObjectURL(url);
    }

    // レンダリング用変数 キーワード絞り込み
    const filteredUrls = urls.filter((u: SharedUrl) => {
        if (!keyword) return true;
        const lower = keyword.toLowerCase();
        return (
            (u.title && u.title.toLowerCase().includes(lower)) ||
            (u.url && u.url.toLowerCase().includes(lower))
        );
    });

    useEffect(() => {
        if (!authorized) return;
        fetchUrls(); // 初回取得

        // 5秒ごとに自動取得
        const interval = setInterval(fetchUrls, 5000);

        // クリーンアップ
        return () => clearInterval(interval);
    }, [authorized, password]);

    if (!authorized) {
        return (
            <main className="container">
                <h1 className="title">共有されたURL</h1>
                <h1 className="title">LinkToMe</h1>
                <form onSubmit={handleLogin} style={{ maxWidth: 320, margin: '2rem auto', textAlign: 'center' }}>
                    <input
                        type="password"
                        value={inputPassword}
                        onChange={e => setInputPassword(e.target.value)}
                        placeholder="パスワード"
                        style={{ padding: '0.5em', width: '80%', marginBottom: '1em' }}
                    />
                    <br />
                    <button type="submit" className="delete-button">表示</button>
                    {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
                </form>
            </main>
        );
    }
    return (
        <main className="container">
            <h1 className="title">LinkToMe - ({urls.length} URLs)</h1>
            <button onClick={downloadTsv} className="download-button">一覧ダウンロード</button>
            <input
                type="text"
                placeholder="キーワードで絞り込み"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                style={{ margin: '1em 0', padding: '0.5em', width: '60%' }}
            />
            <ul className="url-list">
                {filteredUrls.map((u: any) => {
                    // ドメイン抽出
                    let domain = "";
                    try {
                        domain = new URL(u.url).hostname.replace(/^www\./, "");
                    } catch {
                        domain = "";
                    }
                    return (
                        <li key={u.id} className="url-item">
                            <div style={{ display: "flex", alignItems: "center", gap: "1em", marginBottom: "0.2em" }}>
                                <span className="url-date">{new Date(u.createdAt).toLocaleString()}</span>
                                <span className="url-domain" style={{ fontSize: "0.85em", color: "#8a99a8" }}>
                                    {domain}
                                </span>
                            </div>
                            <a href={u.url} target="_blank" rel="noopener noreferrer" className="url-link">{u.title}</a>
                            <button onClick={() => handleDelete(u.id)} className="delete-button">削除</button>
                        </li>
                    );
                })}
            </ul>
        </main>
    );
}