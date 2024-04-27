import { Component, OnDestroy, OnInit } from '@angular/core';
import { CameraDevice, Html5Qrcode } from 'html5-qrcode';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { IssuanceRequestComponent } from '../../../../shared/oid4vc/issuance-request/issuance-request.component';
import { VerifyRequestComponent } from '../../../../shared/oid4vc/verify-request/verify-request.component';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';

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
    HttpClientModule,
    IssuanceRequestComponent,
    VerifyRequestComponent,
  ],
})
export class ScannerComponent implements OnInit, OnDestroy {
  scanner?: Html5Qrcode;
  devices: CameraDevice[] = [];
  selectedDevice?: string;

  status: Status = 'scanning';
  url?: string;

  constructor(
    private httpClient: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const fragment = this.route.snapshot.fragment;
    if (fragment === 'issue') {
      this.getCredential();
      return;
    }
    if (fragment === 'present') {
      this.presentCredential();
      return;
    }
    this.status = 'scanning';
    //set the values so this component covers the whole screen
    document
      .getElementById('reader')
      ?.setAttribute('height', `${window.innerHeight.toString()}px`);
    document
      .getElementById('reader')
      ?.setAttribute('width', `${window.innerWidth.toString()}px`);
    // This method will trigger user permissions
    Html5Qrcode.getCameras()
      .then((devices) => {
        /**
         * devices would be an array of objects of type:
         * { id: "id", label: "label" }
         */
        this.devices = devices;
        if (devices?.length) {
          this.selectedDevice = devices[0].id;
          this.startCamera();
        }
      })
      .catch(() => {
        // handle err
      });
  }

  async ngOnDestroy(): Promise<void> {
    if (this.scanner) {
      await this.scanner.stop();
    }
  }

  async startCamera() {
    this.scanner = new Html5Qrcode('reader');
    //TODO: we need to set the correct dimensions.
    // const dimension =
    //   Math.min(window.innerWidth, window.innerHeight - 84) * 0.6;
    await this.scanner.start(
      { deviceId: { exact: this.selectedDevice } },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: window.innerWidth / window.innerHeight,
      },
      this.onScanSuccess,
      // we do nothing when a scan failed
      () => {}
    );
  }

  async changeCamera(cameraId: string) {
    //TODO: show an option on the top right to change the camera
    await this.scanner?.stop();
    this.selectedDevice = cameraId;
    await this.startCamera();
  }

  onScanSuccess(decodedText: string) {
    // handle the scanned code as you like, for example:
    if (decodedText.startsWith('openid-credential-offer://')) {
      this.showRequest(decodedText, 'receive');
      //TODO: when we scanned it, redirect to another side. There is no need to stay on the scanner page. In this case, the user has already choosen the correct qr code and not a list of it.
    } else if (decodedText.startsWith('openid://')) {
      this.showRequest(decodedText, 'send');
    }
    this.scanner?.stop();
  }

  getCredential() {
    firstValueFrom(
      this.httpClient.post<{ uri: string }>(
        `${environment.demoIssuer}/request`,
        {
          credentialId: 'Identity',
        }
      )
    ).then((response) => this.showRequest(response.uri, 'receive'));
  }

  presentCredential() {
    firstValueFrom(
      this.httpClient.post<{ uri: string }>(
        `${environment.demoVerifier}/request`,
        {
          id: 'eID',
        }
      )
    ).then((response) => this.showRequest(response.uri, 'send'));
  }

  //we should present this inside the scanner component since we do not have a decidated route you can call
  async showRequest(url: string, action: 'send' | 'receive') {
    await this.scanner?.stop();
    this.url = url;
    if (action === 'receive') {
      this.status = 'showRequest';
    } else {
      this.status = 'showVerificationRequest';
    }
  }
}
