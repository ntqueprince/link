const { useState, useEffect } = React;

// Simulated Supabase-like client
const mockSupabase = {
    auth: {
        user: null,
        signUp: async ({ email, password }) => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (email === 'existing@example.com') {
                throw new Error('User already exists');
            }
            const user = { id: Date.now().toString(), email };
            mockSupabase.auth.user = user;
            localStorage.setItem('supabase_user', JSON.stringify(user));
            return { user, error: null };
        },
        signIn: async ({ email, password }) => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (email === 'PW43984@policybazaar.com' && password === '123456') {
                const user = { id: 'demo', email };
                mockSupabase.auth.user = user;
                localStorage.setItem('supabase_user', JSON.stringify(user));
                return { user, error: null };
            }
            if (password === 'wrongpassword') {
                throw new Error('Invalid credentials');
            }
            const user = { id: Date.now().toString(), email };
            mockSupabase.auth.user = user;
            localStorage.setItem('supabase_user', JSON.stringify(user));
            return { user, error: null };
        },
        signOut: async () => {
            mockSupabase.auth.user = null;
            localStorage.removeItem('supabase_user');
            localStorage.removeItem('user_links');
        },
        resetPassword: async ({ email }) => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { error: null };
        }
    },
    from: (table) => ({
        select: () => ({
            eq: (column, value) => ({
                execute: async () => {
                    const links = JSON.parse(localStorage.getItem('user_links') || '[]');
                    return { data: links, error: null };
                }
            })
        }),
        insert: (data) => ({
            execute: async () => {
                const links = JSON.parse(localStorage.getItem('user_links') || '[]');
                const newLink = { ...data, id: Date.now() };
                links.push(newLink);
                localStorage.setItem('user_links', JSON.stringify(links));
                return { data: [newLink], error: null };
            }
        }),
        update: (data) => ({
            eq: (column, value) => ({
                execute: async () => {
                    const links = JSON.parse(localStorage.getItem('user_links') || '[]');
                    const index = links.findIndex(link => link.id === value);
                    if (index !== -1) {
                        links[index] = { ...links[index], ...data };
                        localStorage.setItem('user_links', JSON.stringify(links));
                        return { data: [links[index]], error: null };
                    }
                    return { data: null, error: 'Link not found' };
                }
            })
        }),
        delete: () => ({
            eq: (column, value) => ({
                execute: async () => {
                    const links = JSON.parse(localStorage.getItem('user_links') || '[]');
                    const filteredLinks = links.filter(link => link.id !== value);
                    localStorage.setItem('user_links', JSON.stringify(filteredLinks));
                    return { error: null };
                }
            })
        })
    })
};

// Initialize user from localStorage
const storedUser = localStorage.getItem('supabase_user');
if (storedUser) {
    mockSupabase.auth.user = JSON.parse(storedUser);
}

const AuthForm = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isReset, setIsReset] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (isReset) {
                await mockSupabase.auth.resetPassword({ email });
                setSuccess('Password reset email sent! Check your inbox.');
                setIsReset(false);
            } else if (isLogin) {
                const { user } = await mockSupabase.auth.signIn({ email, password });
                onLogin(user);
            } else {
                const { user } = await mockSupabase.auth.signUp({ email, password });
                onLogin(user);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="logo">
                <h1>LinkBurst</h1>
                <p style={{color: 'rgba(255,255,255,0.8)', marginTop: '10px', fontSize: '1.1rem'}}>
                    A powerful multi-tab link opener
                </p>
            </div>

            <div className="auth-form">
                <h2 style={{color: 'white', marginBottom: '20px', textAlign: 'center'}}>
                    {isReset ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Create Account')}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {!isReset && (
                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <button type="submit" className="btn" disabled={loading} style={{width: '100%', margin: '20px 0'}}>
                        {loading ? 'Loading...' : (isReset ? 'Send Reset Email' : (isLogin ? 'Sign In' : 'Sign Up'))}
                    </button>
                </form>

                <div className="auth-links">
                    {!isReset ? (
                        <>
                            <a
                                href="#"
                                className="auth-link"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsLogin(!isLogin);
                                    setError('');
                                    setSuccess('');
                                }}
                            >
                                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                            </a>
                            {isLogin && (
                                <>
                                    <br /><br />
                                    <a
                                        href="#"
                                        className="auth-link"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setIsReset(true);
                                            setError('');
                                            setSuccess('');
                                        }}
                                    >
                                        Forgot Password?
                                    </a>
                                </>
                            )}
                        </>
                    ) : (
                        <a
                            href="#"
                            className="auth-link"
                            onClick={(e) => {
                                e.preventDefault();
                                setIsReset(false);
                                setError('');
                                setSuccess('');
                            }}
                        >
                            Back to Sign In
                        </a>
                    )}
                </div>
            </div>

            <div className="footer">
                <div className="footer-content">
                    <span className="sparkle">✨</span>
                    Crafted with
                    <span className="heart">❤️</span>
                    by
                    <span className="creator">Shivang</span>
                    <span className="sparkle">✨</span>
                </div>
            </div>
        </div>
    );
};

const Dashboard = ({ user, onLogout }) => {
    const [links, setLinks] = useState([]);
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editUrl, setEditUrl] = useState('');
    const [selectAll, setSelectAll] = useState(true);

    // Pre-defined demo links
    const demoLinks = [
        { title: "Policybazaar Ownership", url: "https://twinternal.policybazaar.com/panel/UpdateOwnership.aspx" },
        { title: "Chat Internal", url: "https://chatinternal.policybazaar.com/direct/68665cd7342febb77efa8891" },
        { title: "Policybazaar SSO", url: "https://pbsso.policybazaar.com/Login?Id=ca22a374f2d54a6a8c81e3989732e781" },
        { title: "Google Form (1)", url: "https://docs.google.com/forms/d/e/1FAIpQLSdtvy16OneV3JUZXPssGOr6Ax8EpW-2RvGFb5H6gzzMfdzhyg/viewform" },
        { title: "BMS", url: "https://bms.policybazaar.com" },
        { title: "Google Sheet", url: "https://docs.google.com/spreadsheets/d/1wq1xc_L5DHRzYnHXeHc6SRaum8BBwWn5ntKbZafVHtk/edit?gid=0#gid=0" },
        { title: "Matrix Dashboard", url: "https://matrixdashboard.policybazaar.com/admin/realtimedashboard" },
        { title: "Chrome Flags", url: "chrome://flags/" },
        { title: "Google Form (2)", url: "https://docs.google.com/forms/d/e/1FAIpQLSe8agnm0fA_qz5QqBY4y4879FPOqGCvbHso6oeSxkaVwPflzA/viewform" },
        { title: "ESS Mobile", url: "https://essmobile.etechaces.com/rvw/hub/ilrt/rvw_logout.htm?_dc=1750336463614" }
    ];

    useEffect(() => {
        loadLinks();
    }, []);

    const loadLinks = async () => {
        try {
            const { data } = await mockSupabase.from('links').select().eq('user_id', user.id).execute();
            const linksWithSelection = data.map(link => ({
                ...link,
                selected: link.selected !== false
            }));
            setLinks(linksWithSelection);
        } catch (error) {
            console.error('Error loading links:', error);
        }
    };

    const addLink = async () => {
        if (!newTitle.trim() || !newUrl.trim()) {
            alert('Both link title and URL are mandatory.');
            return;
        }

        setLoading(true);
        try {
            const title = newTitle.trim();
            const formattedUrl = newUrl.startsWith('http') ? newUrl : `https://${newUrl}`;

            const { data } = await mockSupabase.from('links').insert({
                title,
                url: formattedUrl,
                user_id: user.id,
                selected: true
            }).execute();

            setLinks([...links, { ...data[0], selected: true }]);
            setNewTitle('');
            setNewUrl('');
        } catch (error) {
            console.error('Error adding link:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDemoLinks = async () => {
        setLoading(true);
        try {
            const existingUrls = new Set(links.map(link => link.url));
            const newLinksToAdd = demoLinks.filter(link => !existingUrls.has(link.url));

            if (newLinksToAdd.length === 0) {
                alert("Demo links are already loaded!");
                setLoading(false);
                return;
            }

            const newLinksPromises = newLinksToAdd.map(link =>
                mockSupabase.from('links').insert({
                    title: link.title,
                    url: link.url,
                    user_id: user.id,
                    selected: true
                }).execute()
            );

            const results = await Promise.all(newLinksPromises);
            const newAddedLinks = results.map(result => ({ ...result.data[0], selected: true }));

            setLinks([...links, ...newAddedLinks]);
        } catch (error) {
            console.error('Error loading demo links:', error);
            alert('An error occurred while loading demo links.');
        } finally {
            setLoading(false);
        }
    };


    const updateLink = async (id) => {
        if (!editTitle.trim() || !editUrl.trim()) {
            alert('Both link title and URL are mandatory.');
            return;
        }

        try {
            const title = editTitle.trim();
            const formattedUrl = editUrl.startsWith('http') ? editUrl : `https://${editUrl}`;

            await mockSupabase.from('links').update({
                title,
                url: formattedUrl
            }).eq('id', id).execute();

            setLinks(links.map(link =>
                link.id === id
                    ? { ...link, title, url: formattedUrl }
                    : link
            ));
            setEditingId(null);
            setEditTitle('');
            setEditUrl('');
        } catch (error) {
            console.error('Error updating link:', error);
        }
    };

    const deleteLink = async (id) => {
        if (!confirm('Are you sure you want to delete this link?')) return;

        try {
            await mockSupabase.from('links').delete().eq('id', id).execute();
            setLinks(links.filter(link => link.id !== id));
        } catch (error) {
            console.error('Error deleting link:', error);
        }
    };

    const toggleLinkSelection = (id) => {
        setLinks(links.map(link =>
            link.id === id
                ? { ...link, selected: !link.selected }
                : link
        ));
    };

    const toggleSelectAll = () => {
        const newSelectAll = !selectAll;
        setSelectAll(newSelectAll);
        setLinks(links.map(link => ({ ...link, selected: newSelectAll })));
    };

    const openAllLinks = () => {
        const selectedLinks = links.filter(link => link.selected);
        if (selectedLinks.length === 0) {
            alert('No links selected to open!');
            return;
        }

        selectedLinks.forEach(link => {
            window.open(link.url, '_blank');
        });
    };

    const selectedCount = links.filter(link => link.selected).length;

    return (
        <div className="dashboard">
            <button className="logout-btn" onClick={onLogout}>
                <i className="fas fa-sign-out-alt"></i> Logout
            </button>

            <div className="logo">
                <h1>LinkBurst</h1>
                <p style={{color: 'rgba(255,255,255,0.8)', marginTop: '10px'}}>
                    Welcome back, {user.email}!
                </p>
            </div>

            {/* New Demo Button */}
            <div style={{textAlign: 'center', marginBottom: '20px'}}>
                <button className="btn demo-btn" onClick={loadDemoLinks} disabled={loading}>
                    {loading ? 'Adding Links...' : (
                        <>
                            <i className="fas fa-magic"></i> Load Demo Links
                        </>
                    )}
                </button>
            </div>


            {/* Your Links Section (Moved to the top) */}
            {links.length > 0 && (
                <div className="section">
                    <h3><i className="fas fa-list"></i> Your Links ({links.length})</h3>

                    <div className="select-all-container">
                        <input
                            type="checkbox"
                            className="select-all-checkbox"
                            checked={selectAll}
                            onChange={toggleSelectAll}
                        />
                        <label className="select-all-label" onClick={toggleSelectAll}>
                            Select All Links ({selectedCount} selected)
                        </label>
                    </div>

                    <div className="links-list">
                        {links.map((link, index) => (
                            <div key={link.id} className={`link-item ${!link.selected ? 'unselected' : ''}`}>
                                <input
                                    type="checkbox"
                                    className="link-checkbox"
                                    checked={link.selected}
                                    onChange={() => toggleLinkSelection(link.id)}
                                />
                                <div className="link-number">{index + 1}</div>
                                <div className="link-content">
                                    {editingId === link.id ? (
                                        <div className="edit-form">
                                            <input
                                                type="text"
                                                placeholder="Link title"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                            />
                                            <input
                                                type="url"
                                                placeholder="URL"
                                                value={editUrl}
                                                onChange={(e) => setEditUrl(e.target.value)}
                                            />
                                            <button
                                                className="save-btn"
                                                onClick={() => updateLink(link.id)}
                                            >
                                                <i className="fas fa-save"></i> Save
                                            </button>
                                            <button
                                                className="cancel-btn"
                                                onClick={() => {
                                                    setEditingId(null);
                                                    setEditTitle('');
                                                    setEditUrl('');
                                                }}
                                            >
                                                <i className="fas fa-times"></i> Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="link-title">{link.title}</div>
                                        </>
                                    )}
                                </div>
                                {editingId !== link.id && (
                                    <div className="link-actions">
                                        <button
                                            className="action-btn edit-btn"
                                            onClick={() => {
                                                setEditingId(link.id);
                                                setEditTitle(link.title);
                                                setEditUrl(link.url);
                                            }}
                                            title="Edit link"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                            className="action-btn delete-btn"
                                            onClick={() => deleteLink(link.id)}
                                            title="Delete link"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* LinkBurst Button (Moved after Your Links) */}
            {links.length > 0 && (
                <div style={{textAlign: 'center', margin: '20px 0'}}>
                    <button className="btn link-burst-btn" onClick={openAllLinks}>
                        <i className="fas fa-rocket"></i> LinkBurst ({selectedCount} links)
                    </button>
                </div>
            )}

            {/* Add New Link Section (Moved below the button) */}
            <div className="section">
                <h3><i className="fas fa-plus-circle"></i> Add New Link</h3>
                <div className="add-link-form">
                    <input
                        type="text"
                        className="title-input"
                        placeholder="Link title (mandatory)"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        required
                    />
                    <input
                        type="url"
                        className="url-input"
                        placeholder="Enter URL (e.g., google.com)"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        required
                    />
                    <button
                        className="add-btn"
                        onClick={addLink}
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : (
                            <>
                                <i className="fas fa-plus"></i> Add
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Features Section (Moved to the bottom) */}
            <div className="features-section">
                <h3 style={{color: 'white', marginBottom: '20px', textAlign: 'center'}}>
                    <i className="fas fa-star"></i> Complete Feature Set
                </h3>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon"><i className="fas fa-bolt"></i></div>
                        <div className="feature-title">Batch Open</div>
                        <div className="feature-description">Open multiple links at once with a single click.</div>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><i className="fas fa-save"></i></div>
                        <div className="feature-title">Save & Manage</div>
                        <div className="feature-description">Easily save, edit, and manage your favorite links.</div>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><i className="fas fa-user-friends"></i></div>
                        <div className="feature-title">User Accounts</div>
                        <div className="feature-description">Your links are saved securely to your personal account.</div>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><i className="fas fa-mobile-alt"></i></div>
                        <div className="feature-description">Responsive Design</div>
                        <div className="feature-description">Access your links from any device with a clean interface.</div>
                    </div>
                </div>
            </div>

            <div className="footer">
                <div className="footer-content">
                    <span className="sparkle">✨</span>
                    Crafted with
                    <span className="heart">❤️</span>
                    by
                    <span className="creator">Shivang</span>
                    <span className="sparkle">✨</span>
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const [user, setUser] = useState(mockSupabase.auth.user);

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = async () => {
        await mockSupabase.auth.signOut();
        setUser(null);
    };

    return (
        <div className="container">
            <div className="card">
                {user ? (
                    <Dashboard user={user} onLogout={handleLogout} />
                ) : (
                    <AuthForm onLogin={handleLogin} />
                )}
            </div>
        </div>
    );
};

// Create particles
const createParticles = () => {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.width = Math.random() * 4 + 2 + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
        particlesContainer.appendChild(particle);
    }
};

// Initialize particles
createParticles();

// Render the app
ReactDOM.render(<App />, document.getElementById('root'));