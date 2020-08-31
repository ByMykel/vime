/* eslint-disable no-param-reassign */

import {
  h, Host, Component, Prop, Watch, Method, Element, State,
} from '@stencil/core';
import { Disposal } from '../../../core/player/Disposal';
import { listen } from '../../../../utils/dom';
import { isUndefined, isNull } from '../../../../utils/unit';
import { SettingsController } from './SettingsController';
import { Dispatcher, createDispatcher } from '../../../core/player/PlayerDispatcher';
import { PlayerProps } from '../../../core/player/PlayerProps';
import { withPlayerContext } from '../../../core/player/PlayerContext';

let idCount = 0;

/**
 * @slot - Used to pass in the body of the settings menu, which usually contains submenus.
 */
@Component({
  tag: 'vime-settings',
  styleUrl: 'settings.scss',
})
export class Settings {
  private id!: string;

  private menu!: HTMLVimeMenuElement;

  private disposal = new Disposal();

  private controller?: SettingsController;

  private dispatch!: Dispatcher;

  @Element() el!: HTMLVimeSettingsElement;

  @State() controllerId?: string;

  /**
   * The height of any lower control bar in pixels so that the settings can re-position itself
   * accordingly.
   */
  @Prop() controlsHeight = 65;

  /**
   * Whether the settings menu is opened/closed.
   */
  @Prop({ mutable: true, reflect: true }) active = false;

  @Watch('active')
  onActiveChange() {
    this.dispatch('isSettingsActive', this.active);
    if (isUndefined(this.controller)) return;
    this.controller!.expanded = this.active;
  }

  /**
   * @internal
   */
  @Prop() isMobile: PlayerProps['isMobile'] = false;

  /**
   * @internal
   */
  @Prop() isAudioView: PlayerProps['isAudioView'] = false;

  connectedCallback() {
    this.dispatch = createDispatcher(this);
    idCount += 1;
    this.id = `vime-settings-${idCount}`;
  }

  disconnectedCallback() {
    this.disposal.empty();
  }

  /**
   * Sets the controller responsible for opening/closing this settings.
   */
  @Method()
  async setController(id: string, controller: SettingsController) {
    this.controllerId = id;
    this.controller = controller;
    this.controller.menu = this.id;
    this.disposal.add(listen(this.controller, 'click', () => { this.active = !this.active; }));
    this.disposal.add(listen(this.controller, 'keydown', (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return;
      // We're looking for !active because the `click` event above will toggle it to active.
      if (!this.active) this.menu.focusOnOpen();
    }));
  }

  private onClose(event: CustomEvent<void>) {
    if (isNull(event.target) || (event.target! as HTMLElement).id !== this.id) return;
    this.active = false;
  }

  render() {
    return (
      <Host
        style={{
          bottom: `${this.controlsHeight + 8}px`,
        }}
        class={{
          active: this.active,
          mobile: this.isMobile,
          audio: this.isAudioView,
        }}
      >
        <vime-menu
          identifier={this.id}
          active={this.active}
          controller={this.controllerId ?? ''}
          onVClose={this.onClose.bind(this)}
          ref={(el: any) => { this.menu = el; }}
        >
          <slot />
        </vime-menu>
      </Host>
    );
  }
}

withPlayerContext(Settings, [
  'isMobile',
  'isAudioView',
]);
