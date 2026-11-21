"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./connections-carousel.module.css";

const integrations = ["n8n", "gohighlevel", "zapier", "make", "shopify", "zoko", "zoho", "hubspot", "slack", "jira", "apollo", "trello"] as const;
const wide = new Set<string>(["gohighlevel", "slack", "zoko"]);
const names: Record<(typeof integrations)[number], string> = {
  n8n: "n8n", gohighlevel: "GoHighLevel", zapier: "Zapier", make: "Make", shopify: "Shopify", zoko: "Zoko",
  zoho: "Zoho", hubspot: "HubSpot", slack: "Slack", jira: "Jira", apollo: "Apollo", trello: "Trello",
};

export function ConnectionsCarousel() {
  const rail = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const updateEdges = useCallback(() => {
    const node = rail.current;
    if (!node) return;
    setEdges({ start: node.scrollLeft <= 1, end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 1 });
  }, []);
  useEffect(() => {
    const node = rail.current;
    if (!node) return;
    updateEdges();
    const observer = new ResizeObserver(updateEdges);
    observer.observe(node);
    return () => observer.disconnect();
  }, [updateEdges]);
  const move = (direction: number) => {
    const node = rail.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: reduced ? "auto" : "smooth" });
  };

  return <section className={styles.section} aria-labelledby="connections-heading">
    <div className={styles.headingRow}>
      <div><h2 id="connections-heading">Connect with</h2><p>Planned integrations · Connections are not enabled yet</p></div>
      <div className={styles.controls}>
        <button type="button" aria-label="Scroll integrations backward" onClick={() => move(-1)} disabled={edges.start}>‹</button>
        <button type="button" aria-label="Scroll integrations forward" onClick={() => move(1)} disabled={edges.end}>›</button>
      </div>
    </div>
    <div className={styles.rail} ref={rail} onScroll={updateEdges} tabIndex={0} role="region" aria-label="Planned integrations">
      {integrations.map((id) => <div className={styles.card} key={id}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Local, editor-provided brand assets keep this list dependency-free. */}
        <span className={`${styles.logoFrame} ${id === "gohighlevel" || id === "slack" ? styles.darkFrame : ""}`}>
          <img className={id === "zoko" ? styles.zokoLogo : wide.has(id) ? styles.wideLogo : styles.logo} src={`/brands/${id}.${id === "zoko" ? "png" : "svg"}`} alt="" width={id === "zoko" || wide.has(id) ? 96 : 32} height="32"/>
        </span>
        <span>{names[id]}</span>
      </div>)}
    </div>
  </section>;
}
