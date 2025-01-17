import { Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DateCoercer, DateFormatMode, DateFormatter, ReplayObservable } from '@hypertrace/common';
import { GraphQlRequestService } from '@hypertrace/graphql-client';
import { Observable, Subject } from 'rxjs';
import { map, shareReplay, switchMap, takeUntil } from 'rxjs/operators';
import { LogEvent } from '../../shared/dashboard/widgets/waterfall/waterfall/waterfall-chart';
import { AttributeMetadata } from '../../shared/graphql/model/metadata/attribute-metadata';
import { ObservabilityTraceType } from '../../shared/graphql/model/schema/observability-traces';
import { Trace, traceIdKey, TraceType, traceTypeKey } from '../../shared/graphql/model/schema/trace';
import { SpecificationBuilder } from '../../shared/graphql/request/builders/specification/specification-builder';
import {
  TraceGraphQlQueryHandlerService,
  TRACE_GQL_REQUEST
} from '../../shared/graphql/request/handlers/traces/trace-graphql-query-handler.service';
import { LogEventsService } from '../../shared/services/log-events/log-events.service';
import { MetadataService } from '../../shared/services/metadata/metadata.service';

@Injectable()
export class ApiTraceDetailService implements OnDestroy {
  public static readonly TRACE_ID_PARAM_NAME: string = 'id';
  public static readonly START_TIME_PARAM_NAME: string = 'startTime';

  private readonly specificationBuilder: SpecificationBuilder = new SpecificationBuilder();

  private readonly routeIds$: ReplayObservable<ApiTraceDetailRouteIdParams>;
  private readonly dateCoercer: DateCoercer = new DateCoercer();

  private readonly destroyed$: Subject<void> = new Subject();

  public constructor(
    route: ActivatedRoute,
    private readonly metadataService: MetadataService,
    private readonly graphQlQueryService: GraphQlRequestService,
    private readonly logEventsService: LogEventsService
  ) {
    this.routeIds$ = route.paramMap.pipe(
      map(paramMap => ({
        traceId: paramMap.get(ApiTraceDetailService.TRACE_ID_PARAM_NAME)!,
        startTime: paramMap.get(ApiTraceDetailService.START_TIME_PARAM_NAME) as string | undefined
      })),
      takeUntil(this.destroyed$),
      shareReplay(1)
    );
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  protected getAttributes(): string[] {
    return ['serviceName', 'protocol', 'apiName', 'startTime', 'duration', 'traceId'];
  }

  public fetchTraceDetails(): Observable<ApiTraceDetails> {
    return this.routeIds$.pipe(
      switchMap(routeIds => this.getGqlResponse(routeIds.traceId, routeIds.startTime)),
      switchMap(trace =>
        this.metadataService
          .getAttribute(trace[traceTypeKey], 'duration')
          .pipe(map(durationAttribute => this.constructTraceDetails(trace, durationAttribute)))
      ),
      takeUntil(this.destroyed$),
      shareReplay(1)
    );
  }

  public fetchLogEvents(): Observable<LogEvent[]> {
    return this.routeIds$.pipe(
      switchMap(routeIds =>
        this.logEventsService.getLogEventsGqlResponseForTrace(
          routeIds.traceId,
          routeIds.startTime,
          ObservabilityTraceType.Api
        )
      ),
      map(trace => this.logEventsService.mapLogEvents(trace)),
      takeUntil(this.destroyed$),
      shareReplay(1)
    );
  }

  protected constructTraceDetails(trace: Trace, durationAttribute: AttributeMetadata): ApiTraceDetails {
    return {
      id: trace[traceIdKey],
      traceId: trace.traceId as string,
      startTime: trace.startTime as string,
      type: ObservabilityTraceType.Api,
      timeString: this.buildTimeString(trace, durationAttribute.units),
      titleString: this.buildTitleString(trace)
    };
  }

  protected getGqlResponse(traceId: string, startTime?: string): Observable<Trace> {
    return this.graphQlQueryService.query<TraceGraphQlQueryHandlerService, Trace>({
      requestType: TRACE_GQL_REQUEST,
      traceType: ObservabilityTraceType.Api,
      traceId: traceId,
      timestamp: this.dateCoercer.coerce(startTime),
      traceProperties: this.getAttributes().map(key => this.specificationBuilder.attributeSpecificationForKey(key)),
      spanProperties: [],
      spanLimit: 1
    });
  }

  protected buildTimeString(trace: Trace, units: string): string {
    const formattedStartTime = new DateFormatter({ mode: DateFormatMode.DateAndTimeWithSeconds }).format(
      trace.startTime as number
    );

    return `${formattedStartTime} for ${trace.duration as string} ${units}`;
  }

  protected buildTitleString(trace: Trace): string {
    return `${trace.serviceName as string} ${trace.protocol as string} ${trace.apiName as string}`;
  }
}

interface ApiTraceDetailRouteIdParams {
  traceId: string;
  startTime?: string;
}

export interface ApiTraceDetails {
  id: string;
  traceId: string;
  type: TraceType;
  timeString: string;
  titleString: string;
  startTime?: string | number;
}
