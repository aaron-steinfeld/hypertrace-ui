import { NgModule } from '@angular/core';
import { PageHeaderModule } from '@hypertrace/components';
import { NavigableDashboardModule } from '../../../shared/dashboard/dashboard-wrapper/navigable-dashboard.module';
import { ObservabilityDashboardModule } from '../../../shared/dashboard/observability-dashboard.module';
import { EndpointListComponent } from './endpoint-list.component';
import { endpointListDashboard } from './endpoint-list.dashboard';

@NgModule({
  imports: [
    ObservabilityDashboardModule,
    PageHeaderModule,
    NavigableDashboardModule.withDefaultDashboards(endpointListDashboard)
  ],
  declarations: [EndpointListComponent]
})
export class EndpointListModule {}
