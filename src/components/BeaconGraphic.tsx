import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import {
  BEACON_LIT_ICON_URL,
  BEACON_UNLIT_ICON_URL,
} from '../constants';
import styles from './BeaconGraphic.module.css';

interface LoadedBeacon {
  markup: string;
  viewBox: string;
}

const loadedBeacons = new Map<string, Promise<LoadedBeacon>>();

const loadBeacon = (url: string): Promise<LoadedBeacon> => {
  const cached = loadedBeacons.get(url);
  if (cached) return cached;

  const request = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load beacon SVG (${response.status})`);
      return response.text();
    })
    .then((source) => {
      const document = new DOMParser().parseFromString(source, 'image/svg+xml');
      const svg = document.documentElement;
      if (svg.nodeName.toLowerCase() !== 'svg') throw new Error('Invalid beacon SVG');

      return {
        markup: svg.innerHTML,
        viewBox: svg.getAttribute('viewBox') || '0 0 100 100',
      };
    });

  loadedBeacons.set(url, request);
  return request;
};

interface BeaconGraphicProps {
  isOn: boolean;
  className?: string;
  label: string;
}

export const BeaconGraphic: FunctionComponent<BeaconGraphicProps> = ({ isOn, className, label }) => (
  <BeaconGraphicContent isOn={isOn} className={className} label={label} />
);

const BeaconGraphicContent: FunctionComponent<BeaconGraphicProps> = ({ isOn, className, label }) => {
  const url = isOn ? BEACON_LIT_ICON_URL : BEACON_UNLIT_ICON_URL;
  const [graphic, setGraphic] = useState<LoadedBeacon | null>(null);

  useEffect(() => {
    let cancelled = false;
    setGraphic(null);
    loadBeacon(url)
      .then((loaded) => {
        if (!cancelled) setGraphic(loaded);
      })
      .catch(() => {
        // The image fallback below still works when the asset server disallows CORS fetches.
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!graphic) {
    return <img className={`${styles.icon} ${className ?? ''}`} src={url} alt={label} />;
  }

  return (
    <svg
      className={`${styles.icon} ${className ?? ''}`}
      role="img"
      aria-label={label}
      viewBox={graphic.viewBox}
      preserveAspectRatio="xMidYMid meet"
      dangerouslySetInnerHTML={{ __html: graphic.markup }}
    />
  );
};