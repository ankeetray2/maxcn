import React from 'react';
import { GreeksWorkspaceView } from './GreeksWorkspaceView';

/**
 * GreeksSimulatorView
 * 
 * Renders the full 3-column Greeks Calculator Workspace for Commodity Greeks Pro.
 * Includes:
 * - Left Panel: Market Information, Expiry Information, Volatility Information
 * - Center Panel: Greeks Control Matrix (Delta, Gamma, Theta, Vega, Rho, IV, Spot, OI, Volume, Days to Expiry)
 * - Right Panel: Live Money Impact Panel, Greeks Attribution Breakdown, Scenario Analysis Table, 8 Live Updating Charts
 */
export const GreeksSimulatorView: React.FC = () => {
  return <GreeksWorkspaceView />;
};

export default GreeksSimulatorView;
