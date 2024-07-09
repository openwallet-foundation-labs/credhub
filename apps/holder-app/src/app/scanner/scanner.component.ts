import { Component, OnDestroy, OnInit } from '@angular/core';
import { CameraDevice, Html5Qrcode } from 'html5-qrcode';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import {
  VerifyRequestComponent,
  IssuanceRequestComponent,
} from '@credhub/holder-shared';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FlexLayoutModule } from 'ng-flex-layout';

type Status = 'scanning' | 'showRequest' | 'showVerificationRequest';

@Component({
  selector: 'app-scanner',
  standalone: true,
  templateUrl: './scanner.component.html',
  styleUrl: './scanner.component.scss',
  imports: [
    CommonModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    FlexLayoutModule,
    IssuanceRequestComponent,
    VerifyRequestComponent,
  ],
})
export class ScannerComponent implements OnInit, OnDestroy {
  scanner?: Html5Qrcode;
  devices: CameraDevice[] = [];
  selectedDevice?: string;
  readFromClipboard = false;

  status: Status = 'scanning';
  loading = true;
  url?: string;

  constructor() {
    if (
      navigator.clipboard &&
      typeof navigator.clipboard.readText !== 'undefined'
    ) {
      this.readFromClipboard = true;
    }
  }

  /**
   * Init the scanner
   */
  ngOnInit(): void {
    this.status = 'scanning';
    this.loading = true;
    // This method will trigger user permissions
    Html5Qrcode.getCameras()
      .then(async (devices) => {
        /**
         * devices would be an array of objects of type:
         * { id: "id", label: "label" }
         */
        this.devices = devices;
        //find a device that has a label that contains the word 'back'
        const backCamera = devices.find((device) =>
          device.label.includes('back')
        );
        if (backCamera) {
          this.selectedDevice = backCamera.id;
          await this.startCamera();
          this.loading = false;
        } else if (devices?.length) {
          this.selectedDevice = devices[0].id;
          await this.startCamera();
          this.status = 'scanning';
          this.loading = false;
        }
      })
      .catch((err: Error) => {
        if (err.message.includes('Permission denied')) {
          alert('Please allow camera permissions to use this feature');
        }
        // handle err
      });
  }

  /**
   * Stop the scanner when leaving the page
   */
  async ngOnDestroy(): Promise<void> {
    await this.stopScanning();
  }

  /**
   * Start the camera
   */
  async startCamera() {
    this.scanner = new Html5Qrcode('reader');
    const width = window.innerWidth;
    const height = window.innerHeight;
    const reverseAspectRatio = height / width;
    await this.scanner.start(
      { deviceId: { exact: this.selectedDevice } },
      {
        fps: 10,
        qrbox: { width: 300, height: 300 },
        aspectRatio: reverseAspectRatio,
      },
      this.onScanSuccess.bind(this),
      // we do nothing when a scan failed
      () => {
        // do nothing
      }
    );
  }

  /**
   * Changes the active camera
   * @param cameraId
   */
  async changeCamera(cameraId: string) {
    await this.stopScanning();
    this.selectedDevice = cameraId;
    await this.startCamera();
  }

  /**
   * Handle the scan success
   * @param decodedText
   */
  async onScanSuccess(decodedText: string) {
    // handle the scanned code as you like, for example:
    if (decodedText.startsWith('openid-credential-offer://')) {
      this.showRequest(decodedText, 'receive');
    } else if (decodedText.startsWith('openid://')) {
      this.showRequest(decodedText, 'send');
    } else {
      alert("Scanned text doesn't match the expected format");
    }
  }

  private async stopScanning() {
    if (this.scanner?.isScanning) {
      await this.scanner.stop();
    }
  }

  /**
   * Show the request
   * @param url
   * @param action
   */
  async showRequest(url: string, action: 'send' | 'receive') {
    await this.stopScanning();
    this.url = url;
    if (action === 'receive') {
      this.status = 'showRequest';
    } else {
      this.status = 'showVerificationRequest';
    }
  }

  /**
   * Pass the value from the clipboard, Only works when the user has granted clipboard permissions.
   */
  passFromClipboard() {
    //the navigation permission for clipboard is only working in chrome, so we can not check it here
    navigator.clipboard.readText().then(
      (text) => this.onScanSuccess(text),
      () =>
        alert(
          'CUnable to read from clipboard, have you granted the permission?'
        )
    );
  }

  /**
   * Open the input dialog
   */
  openInput() {
    const url = prompt('Enter the URL to scan');
    if (url) {
      this.onScanSuccess(url);
    }
  }
}
