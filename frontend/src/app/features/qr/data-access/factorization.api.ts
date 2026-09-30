import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { toApiError } from '../../../core/http/api-error';
import {
  FactorizationRequest,
  FactorizationResponse,
  Matrix,
} from './factorization.models';

@Injectable({ providedIn: 'root' })
export class FactorizationApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  factorize(matrix: Matrix): Observable<FactorizationResponse> {
    const body: FactorizationRequest = { matrix };
    return this.http
      .post<FactorizationResponse>(`${this.config().goApiUrl}/api/v1/factorizations`, body)
      .pipe(catchError((err) => throwError(() => toApiError(err))));
  }
}
