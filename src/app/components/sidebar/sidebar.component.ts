import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PatientCollection } from '../../models/patient-collection';
import { Node } from '../../models/node';
import { Threshold } from '../../models/threshold';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Input() patients!: PatientCollection | null;

  @Input() thresholds!: Threshold;

  @Input() nodes!: Node[];

  @Input() occ!: any;

  @Input() showSidebar!: boolean;

  @Output() showSidebarEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();

  hideSidebar(): void {
    this.showSidebar = false;
    this.showSidebarEmitter.emit(false);
  }
}
