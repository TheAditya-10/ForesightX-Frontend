import { useEffect, useMemo, useRef, useState } from "react";

import { stitchScreens } from "./stitchScreens";

const PROJECT_ID = "2167215292630121994";

function formatAssetLabel(index: number, total: number) {
  return `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
}

export default function App() {
  const [activeScreenId, setActiveScreenId] = useState(stitchScreens[0].id);
  const [frameHeight, setFrameHeight] = useState(stitchScreens[0].frameHeight);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const activeScreen = useMemo(
    () => stitchScreens.find((screen) => screen.id === activeScreenId) ?? stitchScreens[0],
    [activeScreenId]
  );

  useEffect(() => {
    document.title = `ForesightX Frontend | ${activeScreen.title}`;
    setFrameHeight(activeScreen.frameHeight);
  }, [activeScreen]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      return;
    }

    let resizeTimer: number | undefined;

    const syncHeight = () => {
      const doc = iframe.contentDocument;
      if (!doc) {
        return;
      }

      const nextHeight = Math.max(
        doc.documentElement.scrollHeight,
        doc.body?.scrollHeight ?? 0,
        activeScreen.frameHeight
      );

      setFrameHeight(nextHeight);
    };

    const scheduleSync = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(syncHeight, 120);
    };

    iframe.addEventListener("load", scheduleSync);
    window.addEventListener("resize", scheduleSync);
    scheduleSync();

    return () => {
      iframe.removeEventListener("load", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      window.clearTimeout(resizeTimer);
    };
  }, [activeScreen]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">Stitch Refresh</p>
          <h1>ForesightX Frontend</h1>
          <p className="sidebar-copy">
            Replaced the prior dashboard implementation with downloaded Stitch exports and local
            screen assets.
          </p>
        </div>

        <div className="project-card">
          <span>Project</span>
          <strong>{PROJECT_ID}</strong>
          <small>{stitchScreens.length} screens mirrored locally</small>
        </div>

        <nav className="screen-nav" aria-label="Stitch screens">
          {stitchScreens.map((screen, index) => {
            const isActive = screen.id === activeScreen.id;

            return (
              <button
                key={screen.id}
                className={isActive ? "screen-link active" : "screen-link"}
                onClick={() => setActiveScreenId(screen.id)}
                type="button"
              >
                <span className="screen-link-index">
                  {formatAssetLabel(index, stitchScreens.length)}
                </span>
                <strong>{screen.title}</strong>
                <span>{screen.subtitle}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="content">
        <section className="hero-panel">
          <div>
            <p className="eyebrow">Downloaded Stitch Assets</p>
            <h2>{activeScreen.title}</h2>
            <p className="hero-copy">{activeScreen.subtitle}</p>
          </div>

          <div className="hero-actions">
            <a href={activeScreen.htmlPath} rel="noreferrer" target="_blank">
              Open raw HTML
            </a>
            <a href={activeScreen.screenshotPath} rel="noreferrer" target="_blank">
              Open screenshot
            </a>
          </div>
        </section>

        <section className="screenshot-strip" aria-label="Screen previews">
          {stitchScreens.map((screen) => {
            const isActive = screen.id === activeScreen.id;

            return (
              <button
                key={screen.id}
                className={isActive ? "shot-card active" : "shot-card"}
                onClick={() => setActiveScreenId(screen.id)}
                type="button"
              >
                <img alt={`${screen.title} screenshot`} src={screen.screenshotPath} />
                <span>{screen.title}</span>
              </button>
            );
          })}
        </section>

        <section className="viewer-panel">
          <div className="viewer-toolbar">
            <div>
              <span className="toolbar-label">Screen ID</span>
              <strong>{activeScreen.screenId}</strong>
            </div>
            <div>
              <span className="toolbar-label">Local file</span>
              <strong>{activeScreen.htmlPath.replace("/stitch/", "public/stitch/")}</strong>
            </div>
            <div>
              <span className="toolbar-label">Mode</span>
              <strong>Hosted export downloaded with curl -L</strong>
            </div>
          </div>

          <iframe
            key={activeScreen.id}
            className="screen-frame"
            ref={iframeRef}
            src={activeScreen.htmlPath}
            style={{ height: `${frameHeight}px` }}
            title={activeScreen.title}
          />
        </section>
      </main>
    </div>
  );
}
