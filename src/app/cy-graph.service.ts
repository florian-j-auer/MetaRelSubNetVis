import {ElementRef, Injectable, ViewChild} from '@angular/core';
import {DataLoaderService} from './data-loader.service';
import {Network} from './network';
import cytoscape from 'cytoscape';
import {Patient} from './patient';
import {ThresholdResponse} from './threshold-response';
import {Threshold} from './threshold';
import {min} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CyGraphService {
  private colors = {
    red: '#ff3d6a',
    yellow: '#e8e857',
    // yellow: '#d6d656',
    blue: '#599eff',
    green: '#0b0',
    gray: '#888'
  }

  private cy: any;
  private metPat: Patient;
  private nonPat: Patient;
  private showAllNodes: boolean;
  private sizeBy: string;
  private colorBy: string;
  private thresholds: ThresholdResponse;

  constructor(private dataLoader: DataLoaderService) { }


  initGraph(cyDiv: ElementRef, sizeBy: string, colorBy:string) {
    this.sizeBy = sizeBy;
    this.colorBy = colorBy;
    console.log("In the init of cyService");
    this.dataLoader.getNetwork().subscribe((network) => {
      console.log("init cytoscape");
      const layer = {};
      let numberOfLayers = 7;
      network.nodes.forEach((node, i) => {
        if(i < 1) {
          layer[node.data.id] = numberOfLayers;     //1
        } else if (i < 5) {                          //5=4+1
          layer[node.data.id] = numberOfLayers - 1;  //4
        } else if (i < 17) {                         //17=12+5
          layer[node.data.id] = numberOfLayers - 2;  //12=4*3
        } else if (i < 37) {                         //53=36+17
          layer[node.data.id] = numberOfLayers - 3;  //36=12*3
        } else if (i < 61) {                        //161=108+53
          layer[node.data.id] = numberOfLayers - 4;  //108=36*3
        } else if (i < 93) {
          layer[node.data.id] = numberOfLayers - 5;
        } else if (i < 133) {
          layer[node.data.id] = numberOfLayers - 6;
        } else {
          layer[node.data.id] = numberOfLayers - 7;
        }
      });


      console.log('Layer: ' + network.nodes[1].layer);

      this.cy = cytoscape({
              container: cyDiv.nativeElement, // container to render in

              elements: network,

              style: [ // the stylesheet for the graph
                {
                  selector: 'node',
                  style: {
                    label: 'data(id)',
                    'text-valign': 'center',
                    'background-color': this.colors.gray,
                    color: '#fff',
                    // color: '#242424',
                    'text-outline-color': this.colors.gray,
                    'text-outline-width': '5px',
                    width: '50px', height: '50px'
                  }
                },
                //
                // {
                //   selector: 'node[?member]',
                //   style: {
                //     'background-color': 'mapData(color, 0.00017, 0.00029, blue, red)',
                //     'text-outline-color': 'mapData(color, 0.00017, 0.00029, blue, red)',
                //     width: 'mapData(size, 0.00017, 0.00029, 50, 130)',
                //     height: 'mapData(size, 0.00017, 0.00029, 50, 130)'
                //   }
                // },
                {
                  selector: 'node[color], node[colorMet], node[colorNonMet]',
                  style: {
                      color: '#383838',
                      'font-weight': 'bold',
                  }
                },
                {
                  selector: 'node[!shown]',
                  style: {
                    visibility: 'hidden'
                  }
                },

                {
                  selector: 'node.mtb',
                  style: {
                    'border-width': '7px',
                    'border-color': this.colors.green
                  }
                },
                {
                  selector: 'node.split',
                  style: {
                    'text-outline-width': '0px',
                    'text-outline-color': this.colors.gray,
                    'text-outline-opacity': '0.3',
                    width: '80px', height: '80px',
                    'pie-size': '100%',
                    'pie-1-background-color': 'green',
                    'pie-1-background-size': '50%',
                    'pie-2-background-color': 'green',
                    'pie-2-background-size': '50%'
                  }
                },
                {
                  selector: 'edge[!shown]',
                  style: {
                    visibility: 'hidden'
                  }
                },

                {
                  selector: 'edge',
                  style: {
                    width: 3,
                    'line-color': '#ccc',
                    'target-arrow-color': '#ccc',
                    'target-arrow-shape': 'triangle'
                  }
                },

                {
                  selector: 'edge[highlight]',
                  style: {
                    width: 3,
                    'line-color': this.colors.green,
                  }
                }

              ],
              layout: {
                name: 'concentric',
                levelWidth( nodes ) { // the letiation of concentric values in each level
                  return 1;
                },
                concentric( node ) { // returns numeric value for each node, placing higher nodes in levels towards the centre
                  console.log('Node: ' + node.data('id') + ' Layer: ' + layer[node.data('id')]);
                  return layer[node.data('id')];
                },
                spacingFactor: 1.65
              }
              // layout: {
              //   name: 'grid',
              // }
            })
      this.cy.elements('node')
        .data('shown', true);
      console.log("Max Node Degree: " + this.cy.elements('node').maxDegree());
      // console.log("degree dist:" + Object.values(degreeDist));
    });
  }

  setMetastaticPatient(metPat: Patient) {
    this.metPat = metPat;
    this.layoutPatient();
  }

  setNonMetastaticPatient(nonPat: Patient) {
    this.nonPat = nonPat;
    this.layoutPatient();
  }

  setShowAllNodes(shown: boolean) {
    this.showAllNodes = shown;
    this.updataShownNodes();
  }

  setSizeBy(by: string) {
    this.sizeBy = by;
    this.layoutPatient();
  }

  setColorBy(by: string) {
    this.colorBy = by;
    this.layoutPatient();
  }

  private updataShownNodes() {
    this.cy.batch(() => {
      this.cy.elements('node[member]')
        .data('shown', true);
      this.cy.elements('node[!member]')
        .data('shown', this.showAllNodes);
      this.cy.elements('node[member]')
        .connectedEdges()
        .data('shown', true);
      this.cy.elements('node[!member]')
        .connectedEdges()
        .data('shown', this.showAllNodes);
    });
  }

  private clear() {
    this.cy.batch(() => {
      this.cy.elements('node')
        .removeData('member')
        .removeData('color')
        .removeData('colorMet')
        .removeData('colorNonMet')
        .removeData('size')
        .removeClass('mtb')
        .removeClass('split');
      this.removeSizeMap();
      // this.updataShownNodes();
    });
  }

  private setSizeMap(minValue, maxValue) {
    const sizeMap = 'mapData(size, ' + minValue + ', ' + maxValue + ', 50, 130)';
    const fontSizeMap = 'mapData(size, ' + minValue + ', ' + maxValue + ', 18, 30)';
    this.cy.style()
      .selector('node[?member]')
      .style('width', sizeMap)
      .style('height', sizeMap)
      .style('font-size', fontSizeMap);
  }

  private removeSizeMap() {
    this.cy.style()
      .selector('node[?member]')
      // .style('background-color', this.colors.gray)
      // .style('text-outline-color', this.colors.gray)
      .style('width', '50px')
      .style('height', '50px')
      .style('font-size', '18px');
  }

  private setColorMap(minValue, maxValue) {
    const colorMap = 'mapData(color, ' + minValue + ', ' + maxValue + ', ' + this.colors.blue + ', ' + this.colors.red + ')';
    this.cy.style()
      .selector('node[color]')
      .style('background-color', colorMap)
      .style('text-outline-color', colorMap);
  }

  private setSplitColorMap(minValueMet, maxValueMet, minValueNonMet, maxValueNonMet) {
    const colorMapMet = 'mapData(colorMet, ' + minValueMet + ', ' + maxValueMet + ', ' + this.colors.blue + ', ' + this.colors.red + ')';
    const colorMapNonMet = 'mapData(colorMet, ' + minValueNonMet + ', ' + maxValueNonMet + ', ' + this.colors.blue + ', ' + this.colors.red + ')';
    this.cy.style()
      .selector('node.split')
      .style('width', '80px')
      .style('height', '80px')
      .style('pie-2-background-color', colorMapMet)
      .style('pie-1-background-color', colorMapNonMet);
  }

  private setColorDisc() {
    this.cy.style()
      .selector('node[color]')
      .style('color', '#242424')
      .style('font-weight', 'bold')
      .selector('node[color = \'LOW\']')
      .style('background-color', this.colors.blue)
      .style('text-outline-color', this.colors.blue)
      .selector('node[color = \'NORMAL\']')
      .style('background-color', this.colors.yellow)
      .style('text-outline-color', this.colors.yellow)
      .selector('node[color = \'HIGH\']')
      .style('background-color', this.colors.red)
      .style('text-outline-color', this.colors.red)
      .selector('node.split[colorMet], node.split[colorNonMet]')
      .style('width', '80px')
      .style('height', '80px')
      .selector('node.split[colorMet = \'LOW\']')
      .style('pie-2-background-color', this.colors.blue)
      .selector('node.split[colorNonMet = \'LOW\']')
      .style('pie-1-background-color', this.colors.blue)
      .selector('node.split[colorMet = \'NORMAL\']')
      .style('pie-2-background-color', this.colors.yellow)
      .selector('node.split[colorNonMet = \'NORMAL\']')
      .style('pie-1-background-color', this.colors.yellow)
      .selector('node.split[colorMet = \'HIGH\']')
      .style('pie-2-background-color', this.colors.red)
      .selector('node.split[colorNonMet = \'HIGH\']')
      .style('pie-1-background-color', this.colors.red);
  }

  private visualizeOne(pat: Patient, threshold: Threshold) {
    console.log('Layout Patient: ' + pat.name);
    this.cy.batch(() => {
      this.clear();

      let size: string;
      if (this.sizeBy === 'rel') {
        size = 'score';
        this.setSizeMap(threshold.threshold, threshold.max);
        // this.setSizeMap(pat.getMinScore(), pat.getMaxScore());
      } else if (this.sizeBy === 'ge') {
        size = 'ge';
        this.setSizeMap(pat.getMinGe(), pat.getMaxGe());
      }

      let color: string;
      if (this.colorBy === 'rel') {
        color = 'score';
        this.setColorMap(threshold.threshold, threshold.max);
        // this.setColorMap(pat.getMinScore(), pat.getMaxScore());
      } else if (this.colorBy === 'ge') {
        color = 'ge';
        this.setColorMap(pat.getMinGe(), pat.getMaxGe());
      } else if (this.colorBy === 'geLevel') {
        color = 'geLevel';
        this.setColorDisc();
      }

      for (const data of pat.patientData) {
        // console.log("Score: " + data.score + " Threshold: " + (threshold.selected / this.thresholds.multiplier) + " IF: " + (data.score >= (threshold.selected / this.thresholds.multiplier)));
        if (data.score >= (threshold.selected / this.thresholds.multiplier)) {
          console.log('size: ' + size);
          console.log('Patient Data: ' + data);
          const node = this.cy.getElementById(data.name)
            .data('member', true)
            .data('shown', true)
            .data('size', data[size])
            .data('color', data[color]);
          if (data.mtb) {
            node.addClass('mtb');
          }
        }
      }

      this.updataShownNodes();
    });
  }

  private visualizeTwo() {
    console.log('Layout Two Patients: ' + this.metPat.name + ' and ' + this.nonPat.name);
    this.cy.batch(() => {
      this.clear();

      let color: string;
      if (this.colorBy === 'rel') {
        color = 'score';
        const minValue = Math.min(this.thresholds.metastatic.threshold, this.thresholds.nonmetastatic.threshold);
        const maxValue = Math.max(this.thresholds.metastatic.max, this.thresholds.nonmetastatic.max);
        this.setColorMap(minValue, maxValue);
        this.setSplitColorMap(
          this.thresholds.metastatic.threshold, this.thresholds.metastatic.max,
          this.thresholds.nonmetastatic.threshold, this.thresholds.nonmetastatic.max
        );
      } else if (this.colorBy === 'ge') {
        color = 'ge';
        const minValue = Math.min(this.metPat.getMinGe(), this.nonPat.getMinGe());
        const maxValue = Math.min(this.metPat.getMaxGe(), this.nonPat.getMaxGe());
        this.setColorMap(minValue, maxValue);
        this.setSplitColorMap(
          this.metPat.getMinGe(), this.metPat.getMaxGe(),
          this.nonPat.getMinGe(), this.nonPat.getMaxGe()
        );
      } else if (this.colorBy === 'geLevel') {
        color = 'geLevel';
        this.setColorDisc();
      }

      const combinedPats = {};
      for (const pat of this.metPat.patientData) {
        combinedPats[pat.name] = [pat];
      }
      for (const pat of this.nonPat.patientData) {
        if (Object.keys(combinedPats).indexOf(pat.name) > -1) {
          combinedPats[pat.name].push(pat);
        } else {
          combinedPats[pat.name] = [pat];
        }
      }

      for (const nodeId of Object.keys(combinedPats)) {
        // console.log("Score: " + data.score + " Threshold: " + (threshold.selected / this.thresholds.multiplier) + " IF: " + (data.score >= (threshold.selected / this.thresholds.multiplier)));
        let data = combinedPats[nodeId];
        console.log("Node: " + nodeId + " Data: " + data + " Length: " + data.length);
        if (data.length === 2) {
          console.log("Min Score: " + Math.max(data[0].score, data[1].score) + " Threshold: " + (this.thresholds.selected / this.thresholds.multiplier));
          if (Math.max(data[0].score, data[1].score) >= (this.thresholds.selected / this.thresholds.multiplier)) {
            console.log('Patient Data: ' + data);
            const node = this.cy.getElementById(nodeId)
              .data('member', true)
              .data('shown', true)
              .addClass('split')
              .data('colorMet', data[0][color])
              .data('colorNonMet', data[1][color]);
            if (data.mtb) {
              node.addClass('mtb');
            }
          }
        } else {
          data = data[0];
          if (data.score >= (this.thresholds.selected / this.thresholds.multiplier)) {
            console.log('Patient Data: ' + data);
            const node = this.cy.getElementById(data.name)
              .data('member', true)
              .data('shown', true)
              .data('color', data[color]);
            if (data.mtb) {
              node.addClass('mtb');
            }
          }
        }
      }

      this.updataShownNodes();
    });
  }

  //TODO: in R: include ge, not only LOW,NORMAL,HIGH
  //Add selector for pos/neg GE and mapping from blue-yellow-red
  //Add selectors and data assignment when more than one node are selected
  layoutPatient() {
    console.log('Met Patient defined: ' + (this.metPat !== undefined));
    console.log('Non Patient defined: ' + (this.nonPat !== undefined));
    if ((this.metPat !== undefined) && (this.nonPat !== undefined)) {
      console.log('Layout two patients!');
      this.clear();
      this.visualizeTwo();
    } else if (this.metPat !== undefined) {
      console.log('Layout metPat!');
      this.visualizeOne(this.metPat, this.thresholds.metastatic);
    } else if (this.nonPat !== undefined) {
      console.log('Layout nonPat!');
      this.visualizeOne(this.nonPat, this.thresholds.nonmetastatic);
    } else {
      console.log('Nothing to layout!');
      this.clear();
      this.cy.elements('node')
        .data('shown', true);
      this.updataShownNodes();
    }
  }

  setThreshold(thresholds: ThresholdResponse) {
    this.thresholds = thresholds;
  }

  updateThreshold(thresholds: ThresholdResponse) {
    this.thresholds = thresholds;
    this.layoutPatient();
  }

  getImage(type: string) {
    let image;
    if (type === 'jpg') {
      image = this.cy.png();
    } else {
      image = this.cy.jpg();
    }
    return image;
  }
}
