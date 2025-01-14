import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MemoizeModule } from '@hypertrace/common';
import {
  FilterButtonModule,
  LabelModule,
  LetAsyncModule,
  ListViewModule,
  LoadAsyncModule,
  TooltipModule
} from '@hypertrace/components';
import { SpanTagsDetailComponent } from './span-tags-detail.component';

@NgModule({
  imports: [
    CommonModule,
    FilterButtonModule,
    ListViewModule,
    LabelModule,
    LetAsyncModule,
    LoadAsyncModule,
    MemoizeModule,
    TooltipModule
  ],
  declarations: [SpanTagsDetailComponent],
  exports: [SpanTagsDetailComponent]
})
export class SpanTagsDetailModule {}
