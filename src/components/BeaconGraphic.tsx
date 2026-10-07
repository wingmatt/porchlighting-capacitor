import { FunctionComponent } from 'preact';
import {
  BEACON_LIT_ICON,
  BEACON_UNLIT_ICON,
} from '../constants';
import { AssetSvg } from './AssetSvg';
import styles from './BeaconGraphic.module.css';

interface BeaconGraphicProps {
  isOn: boolean;
  className?: string;
  label: string;
}

export const BeaconGraphic: FunctionComponent<BeaconGraphicProps> = ({ isOn, className, label }) => (
  <AssetSvg
    asset={isOn ? BEACON_LIT_ICON : BEACON_UNLIT_ICON}
    className={`${styles.icon} ${className ?? ''}`}
    label={label}
    colorVariables={{ '#beacon-base': '--inactive-color', '#beacon-lit': '--active-color' }}
  />
);