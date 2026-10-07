import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { ASSET_URL } from '../constants';
import styles from './AssetSvg.module.css';

interface LoadedAsset {
  markup: string;
  viewBox: string;
}

export interface AssetSvgProps {
  asset: string;
  className?: string;
  label?: string;
  colorVariables?: Record<string, string>;
}

const loadedAssets = new Map<string, Promise<LoadedAsset>>();

const assetUrl = (asset: string) => `${ASSET_URL}/${asset.replace(/^\/+/, '')}`;

const loadAsset = (url: string): Promise<LoadedAsset> => {
  const cached = loadedAssets.get(url);
  if (cached) return cached;

  const request = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load SVG asset (${response.status})`);
      return response.text();
    })
    .then((source) => {
      const document = new DOMParser().parseFromString(source, 'image/svg+xml');
      const svg = document.documentElement;
      if (svg.nodeName.toLowerCase() !== 'svg') throw new Error('Invalid SVG asset');

      return {
        markup: svg.innerHTML,
        viewBox: svg.getAttribute('viewBox') || '0 0 100 100',
      };
    });

  loadedAssets.set(url, request);
  return request;
};

const colorStyles = (colorVariables: Record<string, string> = {}) => Object.entries(colorVariables)
  .map(([selector, variable]) => `${selector}{color:var(${variable});fill:currentColor;}`)
  .join('');

export const AssetSvg: FunctionComponent<AssetSvgProps> = ({ asset, className, label, colorVariables }) => {
  const url = assetUrl(asset);
  const [graphic, setGraphic] = useState<LoadedAsset | null>(null);

  useEffect(() => {
    let cancelled = false;
    setGraphic(null);
    loadAsset(url)
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

  const classes = `${styles.icon} ${className ?? ''}`;
  if (!graphic) return <img className={classes} src={url} alt={label ?? ''} aria-hidden={!label} />;

  return (
    <svg
      className={classes}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={!label}
      viewBox={graphic.viewBox}
      preserveAspectRatio="xMidYMid meet"
      dangerouslySetInnerHTML={{ __html: `${colorStyles(colorVariables)}${graphic.markup}` }}
    />
  );
};