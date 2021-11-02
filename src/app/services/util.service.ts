import { Injectable } from '@angular/core';

/**
 * Nodes are colored based on their gene expression, their abstract gene expression levels or
 * based on their relevance
 */
export enum ColorNodesBy {
  geneExpressionLevel,
  geneExpression,
  relevance,
}

/**
 * Sizes of the nodes are defined by either gene expression or relevance
 */
export enum NodeSizeBy {
  geneExpression,
  relevance,
}

/**
 * Cancer status can either be metastatic or nonmetastatic
 */
export enum CancerStatus {
  metastatic,
  nonmetastatic,
}

@Injectable({
  providedIn: 'root',
})
export class UtilService {
  /**
   * Color nodes by enum
   */
  colorNodesBy = ColorNodesBy;

  /**
   * Node size by enum
   */
  nodeSizeBy = NodeSizeBy;

  /**
   * Cancer status enum
   */
  cancerStatus = CancerStatus;
}