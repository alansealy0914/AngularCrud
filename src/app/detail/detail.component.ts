import { Component, OnInit } from '@angular/core';

import { environment } from '@env/environment';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Logger } from '@core';

import { ApiHttpService } from '@app/services/api-http.service';
import { ApiEndpointsService } from '@app/services/api-endpoints.service';
import { Position } from '@shared/models/position';
import { DataResponsePosition } from '@shared/classes/data-response-position';

import { ConfirmationDialogService } from '@app/services/confirmation-dialog.service';

import { RxwebValidators } from '@rxweb/reactive-form-validators';

import { ToastService } from '@app/services/toast.service';

const log = new Logger('Detail');

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
})
export class DetailComponent implements OnInit {
  title = 'ng-bootstrap-modal-demo';
  closeResult: string;

  version: string | null = environment.version;
  formMode = 'New';
  sub: any;
  id: any;
  entryForm: FormGroup;
  error: string | undefined;

  position: Position;

  isAddNew: boolean = false;

  constructor(
    public toastService: ToastService,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private apiHttpService: ApiHttpService,
    private apiEndpointsService: ApiEndpointsService,
    private confirmationDialogService: ConfirmationDialogService
  ) {
    this.createForm();
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe((params) => {
      this.id = params['id'];
      if (this.id !== undefined) {
        this.read(this.route.snapshot.paramMap.get('id'));
        this.formMode = 'Edit';
      } else {
        this.isAddNew = true;
        this.formMode = 'New';
      }
    });
    log.debug('ngOnInit:', this.id);
  }

  // Insert button click
  onInsert() {
    this.create(this.entryForm.value);
    log.debug('OnInsert: ', this.entryForm.value);
    log.debug('OnInsert: ', this.entryForm.get('positionNumber').value);
  }

  // Update button click
  onUpdate() {
    this.put(this.entryForm.get('id').value, this.entryForm.value);
    this.showSuccess('Great job!', 'Data is updated');
  }

  // Delete button click
  onDelee() {
    this.confirmationDialogService
      .confirm('Position deletion', 'Are you sure you want to delete?')
      .then((confirmed) => {
        this.delete(this.entryForm.get('id').value);
        //log.debug('onDelee: ', this.entryForm.value);
      })
      .catch(() => {
        //log.debug('onDelee: ', 'Cancel');
      });
  }

  read(id: any): void {
    this.apiHttpService.get(this.apiEndpointsService.getPositionByIdEndpoint(id), id).subscribe(
      //Assign resp to class-level model object.
      (resp: DataResponsePosition) => {
        //Assign data to class-level model object.
        this.position = resp.data;
        //Populate reactive form controls with model object properties.
        this.entryForm.setValue({
          id: this.position.id,
          positionNumber: this.position.positionNumber,
          positionTitle: this.position.positionTitle,
          positionDescription: this.position.positionDescription,
          positionSalary: this.position.positionSalary,
        });
      },
      (error) => {
        log.debug(error);
      }
    );
  }

  delete(id: any): void {
    this.apiHttpService.delete(this.apiEndpointsService.deletePositionByIdEndpoint(id), id).subscribe(
      (resp: any) => {
        log.debug(resp);
        this.showSuccess('Great job!', 'Data is deleted');
        this.entryForm.reset();
        this.isAddNew = true;
      },
      (error) => {
        //this.showError();
        log.debug(error);
      }
    );
  }

  create(data: any): void {
    this.apiHttpService.post(this.apiEndpointsService.postPositionsEndpoint(), data).subscribe((resp: any) => {
      this.id = resp.data; //guid return in data
      this.showSuccess('Great job!', 'Data is inserted');
      this.entryForm.reset();
    });
  }

  put(id: string, data: any): void {
    this.apiHttpService.put(this.apiEndpointsService.putPositionsPagedEndpoint(id), data).subscribe((resp: any) => {
      this.id = resp.data; //guid return in data
    });
  }

  private createForm() {
    this.entryForm = this.formBuilder.group({
      id: [''],
      positionNumber: ['', Validators.required],
      positionTitle: ['', Validators.required],
      positionDescription: ['', Validators.required],
      positionSalary: ['', RxwebValidators.numeric({ allowDecimal: true, isFormat: false })],
    });
  }

  showSuccess(headerText: string, bodyText: string) {
    this.toastService.show(bodyText, {
      classname: 'bg-success text-light',
      delay: 2000,
      autohide: true,
      headertext: headerText,
    });
  }
}