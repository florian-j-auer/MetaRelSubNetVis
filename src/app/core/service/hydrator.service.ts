import { Injectable } from '@angular/core';
import { NodeAttributesItem } from '../../data/schema/node-attributes-item';
import { Patient } from '../../data/schema/patient';
import { PatientCollection } from '../../data/schema/patient-collection';
import { PatientDetails } from '../../data/schema/patient-details';
import { PatientItem } from '../../data/schema/patient-item';
import { NodeRaw } from '../../data/schema/node-raw';
import { NetworkEdge } from '../../data/schema/network-edge';
import { NetworkNode } from '../../data/schema/network-node';
import { NetworkOccurrences } from '../../data/schema/network-occurrences';
import { Threshold } from '../../data/schema/threshold';

@Injectable({
  providedIn: 'root',
})
export class HydratorService {
  hydrateNetworkAttributes(networkAttributes: any, patients: PatientCollection, labels: string[]) {
    let patientGroups: string[] = [];
    let patientNames: string[] = [];
    let patientSurvivalYears: number[] = [];
    let patientSubtypes: string[] = [];

    networkAttributes.forEach((attribute: NodeAttributesItem) => {
      if (attribute.n === 'PatientGroups') {
        patientGroups = attribute.v as unknown as string[];
      }
      if (attribute.n === 'Patients') {
        patientNames = attribute.v as unknown as string[];
      }
      if (attribute.n === 'PatientSurvivalYears') {
        patientSurvivalYears = attribute.v as unknown as number[];
      }
      if (attribute.n === 'PatientSubtype') {
        patientSubtypes = attribute.v as unknown as string[];
      }
    });

    const groupLabels = [...new Set(patientGroups)];
    const groupLabelA = groupLabels[0];
    const groupLabelB = groupLabels[1];
    labels.push(groupLabelA);
    labels.push(groupLabelB);

    for (let i = 0; i < patientGroups.length; i++) {
      const patient: Patient = {
        mfsYears: patientSurvivalYears[i],
        subtype: patientSubtypes[i],
        name: patientNames[i],
      };
      if (patientGroups[i] === groupLabelA) {
        patients.groupA.push(patient);
      } else if (patientGroups[i] === groupLabelB) {
        patients.groupB.push(patient);
      }
    }
    return patientSubtypes;
  }

  hydrateNodeAttributes(
    nodeAttributes: any,
    patientCollection: PatientCollection,
    nodesDictionary: any,
  ) {
    const patients = { ...patientCollection };
    const geneExpressionValues = nodeAttributes.filter((a: NodeAttributesItem) =>
      a.n.endsWith('_GE'),
    );

    // find geMin and geMax
    geneExpressionValues.forEach((ge: NodeAttributesItem) => {
      const geVal: number = Number.parseFloat(ge.v);
      if (!Number.isNaN(geVal) && geVal < patients.geMin) {
        patients.geMin = geVal;
      }
      if (!Number.isNaN(geVal) && geVal > patients.geMax) {
        patients.geMax = geVal;
      }
    });

    const patientDetailItemA: PatientDetails = {};
    patients.groupA.forEach((patient) => {
      patientDetailItemA[patient.name] = [] as PatientItem[];

      const patientDetailsRaw: NodeAttributesItem[] = nodeAttributes.filter(
        (a: NodeAttributesItem) => a.n.startsWith(patient.name),
      );

      patientDetailsRaw.forEach((detail) => {
        const proteinName = nodesDictionary[detail.po];
        if (!patientDetailItemA[patient.name].map((a) => a.name).includes(proteinName)) {
          patientDetailItemA[patient.name].push({
            id: detail.po,
            name: proteinName,
            score: 0,
            ge: 0,
            geLevel: '',
            mtb: false,
          });
        }
        const relevantDetail = patientDetailItemA[patient.name].find((a) => a.name === proteinName);
        if (relevantDetail) {
          if (detail.n.endsWith('_GE')) {
            const geValue = Number(detail.v);
            if (!Number.isNaN(geValue)) {
              relevantDetail.ge = geValue;
            }
          } else if (detail.n.endsWith('_GE_Level')) {
            relevantDetail.geLevel = detail.v;
          } else if (detail.n.endsWith('_Score')) {
            const scoreValue = Number(detail.v);
            if (!Number.isNaN(scoreValue)) {
              relevantDetail.score = scoreValue;
            }
          } else if (detail.n.endsWith('_MTB')) {
            relevantDetail.mtb = detail.v === 'true';
          }
        }
      });
    });

    const patientDetailItemB: PatientDetails = {};
    patients.groupB.forEach((patient) => {
      patientDetailItemB[patient.name] = [] as PatientItem[];

      const patientDetailsRaw: NodeAttributesItem[] = nodeAttributes.filter(
        (a: NodeAttributesItem) => a.n.startsWith(patient.name),
      );

      patientDetailsRaw.forEach((detail) => {
        const proteinName = nodesDictionary[detail.po];
        if (!patientDetailItemB[patient.name].map((a) => a.name).includes(proteinName)) {
          patientDetailItemB[patient.name].push({
            id: detail.po,
            name: proteinName,
            score: 0,
            ge: 0,
            geLevel: '',
            mtb: false,
          });
        }
        const relevantDetail = patientDetailItemB[patient.name].find((a) => a.name === proteinName);
        if (relevantDetail) {
          if (detail.n.endsWith('_GE')) {
            const geValue = Number(detail.v);
            if (!Number.isNaN(geValue)) {
              relevantDetail.ge = geValue;
            }
          } else if (detail.n.endsWith('_GE_Level')) {
            relevantDetail.geLevel = detail.v;
          } else if (detail.n.endsWith('_Score')) {
            const scoreValue = Number(detail.v);
            if (!Number.isNaN(scoreValue)) {
              relevantDetail.score = scoreValue;
            }
          } else if (detail.n.endsWith('_MTB')) {
            relevantDetail.mtb = detail.v === 'true';
          }
        }
      });
    });

    patients.detailsA = patientDetailItemA;
    patients.detailsB = patientDetailItemB;
    return patients;
  }

  hydrateNodesMap(nodes: any[]): any {
    const nodesDictionary: any = {};
    nodes.forEach((node: NodeRaw) => {
      if (!nodesDictionary[node['@id']]) {
        nodesDictionary[node['@id']] = node.n;
      }
    });
    return nodesDictionary;
  }

  hydrateNodes(nodes: any[], patients: PatientCollection, subtypes: string[]): any {
    const occurrences: { [key: string]: NetworkOccurrences } = {};

    const subtypeMap: any = {};

    patients.groupA.forEach((a) => {
      subtypeMap[a.name] = a.subtype;
    });
    patients.groupB.forEach((b) => {
      subtypeMap[b.name] = b.subtype;
    });

    Object.entries(patients.detailsA).forEach((a) => {
      const patientName = a[0];
      const nodeItems = a[1];
      nodeItems.forEach((node) => {
        // init
        if (!Object.keys(occurrences).includes(node.name)) {
          occurrences[node.name] = {
            all: 0,
          };
          subtypes.forEach((type) => {
            occurrences[node.name][type] = 0;
          });
        }
        occurrences[node.name][subtypeMap[patientName]] += 1;
        occurrences[node.name].all += 1;
      });
    });

    Object.entries(patients.detailsB).forEach((a) => {
      const patientName = a[0];
      const nodeItems = a[1];
      nodeItems.forEach((node) => {
        // init
        if (!Object.keys(occurrences).includes(node.name)) {
          occurrences[node.name] = {
            all: 0,
          };
          subtypes.forEach((type) => {
            occurrences[node.name][type] = 0;
          });
        }
        occurrences[node.name][subtypeMap[patientName]] += 1;
        occurrences[node.name].all += 1;
      });
    });

    const typedNodes: NetworkNode[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const node: NetworkNode = {
        data: {
          id: n['@id'],
          name: n.n,
        },
        occ: occurrences[n.n],
      };
      typedNodes.push(node);
    }
    return typedNodes;
  }

  hydrateEdges(edges: any[]): NetworkEdge[] {
    const typedEdges: NetworkEdge[] = [];
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      const edge: NetworkEdge = {
        data: {
          id: e['@id'],
          name: e['@id'],
          source: e.s,
          target: e.t,
        },
      };
      typedEdges.push(edge);
    }
    return typedEdges;
  }

  hydrateOccurrences(patients: PatientCollection): NetworkOccurrences {
    const occurrences: NetworkOccurrences = {
      all: 0,
    };

    const patientsAll = patients.groupA.concat(patients.groupB);
    patientsAll.forEach((a) => {
      if (!Object.keys(occurrences).includes(a.subtype)) {
        occurrences[a.subtype] = 0;
      }
      occurrences[a.subtype] += 1;
      occurrences.all += 1;
    });
    return occurrences;
  }

  hydrateThresholds(patients: PatientCollection): Threshold {
    const threshold: Threshold = {
      groupA: {
        threshold: 0,
        max: 0,
      },
      groupB: {
        threshold: 0,
        max: 0,
      },
    };

    let aMin = Number.MAX_SAFE_INTEGER;
    let aMax = Number.MIN_SAFE_INTEGER;
    Object.entries(patients.detailsA).forEach((a) => {
      const patientNodes = a[1];
      patientNodes.forEach((node) => {
        if (node.score < aMin) {
          aMin = node.score;
        }
        if (node.score > aMax) {
          aMax = node.score;
        }
      });
    });

    let bMin = Number.MAX_SAFE_INTEGER;
    let bMax = Number.MIN_SAFE_INTEGER;
    Object.entries(patients.detailsB).forEach((a) => {
      const patientNodes = a[1];
      patientNodes.forEach((node) => {
        if (node.score < bMin) {
          bMin = node.score;
        }
        if (node.score > bMax) {
          bMax = node.score;
        }
      });
    });

    threshold.groupA.threshold = aMin;
    threshold.groupA.max = aMax;
    threshold.groupB.threshold = bMin;
    threshold.groupB.max = bMax;
    return threshold;
  }
}
