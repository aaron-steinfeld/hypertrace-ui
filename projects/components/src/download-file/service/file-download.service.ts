import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Dictionary } from '@hypertrace/common';
import { isEmpty, startCase, uniq } from 'lodash-es';
import { Observable, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import { NotificationService } from '../../notification/notification.service';

@Injectable({ providedIn: 'root' })
export class FileDownloadService {
  private readonly downloadElement: HTMLAnchorElement;

  public constructor(private readonly notificationService: NotificationService) {
    this.downloadElement = this.createDownloadElement();
  }

  /**
   * Downloads data as text content
   * @param config Text download config
   */
  public downloadAsText(config: FileDownloadBaseConfig): Observable<FileDownloadEvent> {
    return this.download({ ...config }, data => `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`);
  }

  public downloadBlob(config: BlobDownloadFileConfig): Observable<FileDownloadEvent> {
    return this.download({ ...config }, blob => URL.createObjectURL(blob));
  }

  /**
   * Downloads data as csv formatted content
   * @param config Csv download config
   */
  public downloadAsCsv(config: CsvDownloadFileConfig): Observable<FileDownloadEvent> {
    const getAllDataKeys = (data: Dictionary<unknown>[]): string[] => uniq(data.map(row => Object.keys(row)).flat());
    // Value replacer for null and undefined values
    const replacer = (_: string, value: string) => value ?? '-';
    const csvData$ = config.dataSource.pipe(
      map(data => {
        const allKeys = isEmpty(config.header) ? getAllDataKeys(data) : config.header!;
        const header = allKeys.map(startCase);
        const values = data.map(row => allKeys.flatMap(key => JSON.stringify(row?.[key], replacer)));

        return [header, ...values];
      }),
      map(data => data.map(datum => datum.join(',')).join('\r\n')) // Join data to create a string
    );

    return this.download({ ...config, dataSource: csvData$ }, csvData => {
      const csvFile = new Blob([csvData], { type: 'text/csv' });

      return window.URL.createObjectURL(csvFile);
    });
  }

  private createDownloadElement(): HTMLAnchorElement {
    const downloadElem = document.createElement('a');
    downloadElem.setAttribute('display', 'none');
    document.body.appendChild(downloadElem);

    return downloadElem;
  }

  /**
   * Subscribes to the data and starts the download
   * @param config File download base config
   * @param getHref Href provider to download
   * @param fileType Download File Type
   */
  private download<T>(config: FileDownloadBaseConfig<T>, getHref: (data: T) => string): Observable<FileDownloadEvent> {
    return config.dataSource.pipe(
      take(1),
      map(data => {
        this.downloadElement.href = getHref(data);
        this.downloadElement.download = config.fileName;
        this.downloadElement.click();

        const successEvent: FileDownloadSuccessEvent = { type: FileDownloadEventType.Success };

        return successEvent;
      }),
      this.notificationService.withNotification(
        config.successMsg ?? 'File download successful.',
        config.failureMsg ?? 'File download failed. Please try again.'
      ),
      catchError(error =>
        of({
          type: FileDownloadEventType.Failure,
          error: this.getFileDownloadErrorMessage(error)
        })
      )
    );
  }

  private getFileDownloadErrorMessage(errorResponse: unknown): string {
    return errorResponse instanceof HttpErrorResponse
      ? errorResponse.error.error
      : errorResponse instanceof Error
      ? errorResponse.message
      : 'File upload failed due to unknown error';
  }
}

export interface CsvDownloadFileConfig extends FileDownloadBaseConfig<Dictionary<unknown>[]> {
  header?: string[];
  fileName: CsvFileName; // Only csv files allowed here
}

export type CsvFileName = `${string}.csv`;

export interface FileDownloadBaseConfig<T = string> {
  dataSource: Observable<T>;
  fileName: string; // Include the file extension (.txt, .csv etc)
  successMsg?: string;
  failureMsg?: string;
}

export type BlobDownloadFileConfig = FileDownloadBaseConfig<Blob>;

export const enum FileDownloadEventType {
  Failure = 'failure',
  Success = 'success'
}
export interface FileDownloadFailureEvent {
  type: FileDownloadEventType.Failure;
  error: string;
}

export interface FileDownloadSuccessEvent {
  type: FileDownloadEventType.Success;
}

export type FileDownloadEvent = FileDownloadFailureEvent | FileDownloadSuccessEvent;
