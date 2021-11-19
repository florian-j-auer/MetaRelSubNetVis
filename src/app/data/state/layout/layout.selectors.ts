import { createSelector } from '@ngrx/store';
import { AppState } from '../app.state';
import { LayoutState } from './layout.state';

const selectState = createSelector(
  (appState: AppState) => appState.layout,
  (state: LayoutState) => state,
);

export const selectNodeColorBy = createSelector(
  selectState,
  (state: LayoutState) => state.nodeColorBy,
);
export const selectNodeSizeBy = createSelector(
  selectState,
  (state: LayoutState) => state.nodeSizeBy,
);
export const selectShowAllNodes = createSelector(
  selectState,
  (state: LayoutState) => state.showAllNodes,
);
export const selectShowOnlySharedNodes = createSelector(
  selectState,
  (state: LayoutState) => state.showOnlySharedNodes,
);
export const selectShowMtbResults = createSelector(
  selectState,
  (state: LayoutState) => state.showMtbResults,
);
