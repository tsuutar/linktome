'use client';
import { useEffect, useState } from 'react';
import './globals.css';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function Home() {
    //hook
    const [urls, setUrls] = useState([]);
    const [password, setPassword] = useState('');
    //他のuseState
    const [inputPassword, setInputPassword] = useState('');
    const [authorized, setAuthorized] = useState(false);
    const [error, setError] = useState('');
    const [keyword, setKeyword] = useState('');


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
                authorization: `Bearer ${password}`
            }
        })
            .then(res => {
                if (!res.ok) throw new Error('認証エラー');
                return res.json();
            })
            .then(data => setUrls(data))
            .catch(() => setError('パスワードが違います'));
    };

    // 削除
    async function handleDelete(id: number) {
        if (!window.confirm("削除しますか？")) return;
        await fetch(`${basePath}/api/delete?id=${id}`, {
            method: 'DELETE',
            headers: {
                authorization: `Bearer ${password}`
            }
        });
        setUrls(urls.filter((u: any) => u.id !== id));
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
    const filteredUrls = urls.filter((u: any) => {
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