import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ButtonModule } from '../../button/button.module';
import { IconModule } from '../../icon/icon.module';
import { OpenInNewTabModule } from '../../open-in-new-tab/open-in-new-tab.module';
import { TooltipModule } from '../../tooltip/tooltip.module';
import { SheetOverlayComponent } from './sheet-overlay.component';

@NgModule({
  imports: [CommonModule, ButtonModule, TooltipModule, IconModule, OpenInNewTabModule],
  declarations: [SheetOverlayComponent],
  exports: [SheetOverlayComponent]
})
export class SheetOverlayModule {}
