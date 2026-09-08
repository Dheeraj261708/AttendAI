import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

export default function AppLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("attendai-theme") || "light";
    });

    useEffect(() => {
        const applyTheme = () => {
            const savedTheme =
                localStorage.getItem("attendai-theme") || "light";

            setTheme(savedTheme);

            document.documentElement.classList.remove(
                "light",
                "dark"
            );

            document.documentElement.classList.add(savedTheme);

            document.documentElement.setAttribute(
                "data-theme",
                savedTheme
            );
        };

        applyTheme();

        window.addEventListener(
            "attendai-theme-change",
            applyTheme
        );

        return () => {
            window.removeEventListener(
                "attendai-theme-change",
                applyTheme
            );
        };
    }, []);

    const content = children || <Outlet />;

    return (
        <div
            className={`
                min-h-screen
                w-full
                max-w-full
                overflow-x-hidden
                transition-colors
                duration-200
                ${
                    theme === "dark"
                        ? "bg-slate-950 text-white"
                        : "bg-slate-50 text-slate-900"
                }
            `}
        >
            <div className="flex min-h-screen w-full max-w-full overflow-x-hidden">

                {/* =====================================================
                    SIDEBAR
                ====================================================== */}

                <Sidebar
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                {/* =====================================================
                    MAIN APPLICATION AREA
                ====================================================== */}

                <div
                    className="
                        flex
                        min-h-screen
                        min-w-0
                        w-0
                        flex-1
                        flex-col
                        overflow-x-hidden
                    "
                >

                    {/* =================================================
                        NAVBAR
                    ================================================= */}

                    <Navbar
                        onMenu={() => setSidebarOpen(true)}
                    />

                    {/* =================================================
                        PAGE CONTENT
                    ================================================= */}

                    <main
                        className={`
                            min-w-0
                            w-full
                            max-w-full
                            flex-1
                            overflow-x-hidden
                            overflow-y-auto
                            transition-colors
                            duration-200
                            ${
                                theme === "dark"
                                    ? "bg-slate-950"
                                    : "bg-slate-50"
                            }
                        `}
                    >
                        <div
                            className="
                                w-full
                                min-w-0
                                max-w-full
                                overflow-x-hidden
                            "
                        >
                            {content}
                        </div>
                    </main>

                </div>
            </div>
        </div>
    );
}