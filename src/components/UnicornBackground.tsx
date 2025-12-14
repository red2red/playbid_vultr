"use client";

import { useEffect } from "react";

export function UnicornBackground() {
    useEffect(() => {
        // Initialize UnicornStudio object if strictly needed locally, 
        // but the script mostly handles it. We use the logic from the snippet.

        const initUnicorn = () => {
            // @ts-ignore
            if (!window.UnicornStudio) {
                // @ts-ignore
                window.UnicornStudio = { isInitialized: false };
            }

            // Check if script is already loaded
            const existingScript = document.querySelector('script[src*="unicornStudio.umd.js"]');
            if (existingScript) {
                // If script exists, just try to init if not verified
                // @ts-ignore
                if (window.UnicornStudio && !window.UnicornStudio.isInitialized) {
                    // @ts-ignore
                    if (typeof window.UnicornStudio.init === 'function') {
                        // @ts-ignore
                        window.UnicornStudio.init();
                        // @ts-ignore
                        window.UnicornStudio.isInitialized = true;
                    }
                }
                return;
            }

            const i = document.createElement("script");
            i.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.5.2/dist/unicornStudio.umd.js";
            i.onload = function () {
                // @ts-ignore
                if (window.UnicornStudio && !window.UnicornStudio.isInitialized) {
                    // @ts-ignore
                    window.UnicornStudio.init();
                    // @ts-ignore
                    window.UnicornStudio.isInitialized = true;
                }
            };
            (document.head || document.body).appendChild(i);
        };

        initUnicorn();
    }, []);

    return (
        <div
            data-us-project="xjuFE5XOihJGKy5xfdDb"
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                // Set to 0 or -1. Since page content has z-50 or z-10, 0 is fine.
                // The user previously had -1 in plan, but 0 is usually safer if body bg is white opacity.
                // However, standard for bg is -1.
                // Let's stick to -1 to be safe against standard stacking contexts.
                zIndex: -1,
                pointerEvents: "none",
            }}
        />
    );
}
