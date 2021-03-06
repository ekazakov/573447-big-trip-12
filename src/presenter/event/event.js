import {
  renderElement,
  replaceWithElement,
  removeElement,
  checkIsDateEqual,
} from '~/helpers';
import {
  RenderPosition,
  KeyboardKey,
  UserAction,
  UpdateType,
  EventState,
} from '~/common/enums';
import EventView from '~/view/event/event';
import FormEventView from '~/view/form-event/form-event';
import {EventMode} from './common';

class Event {
  constructor({
    containerNode,
    destinations,
    offers,
    changeEvent,
    changeEventMode,
  }) {
    this._containerNode = containerNode;
    this._destinations = destinations;
    this._offers = offers;
    this._changeEvent = changeEvent;
    this._changeEventMode = changeEventMode;

    this._even = null;
    this._eventMode = EventMode.PREVIEW;

    this._eventComponent = null;
    this._eventFormComponent = null;

    this._onEscKeyDown = this._onEscKeyDown.bind(this);
    this._editEvent = this._editEvent.bind(this);
    this._deleteEvent = this._deleteEvent.bind(this);
    this._submitForm = this._submitForm.bind(this);
    this._addToFavorite = this._addToFavorite.bind(this);
    this._closeFormEvent = this._closeFormEvent.bind(this);
  }

  init(event) {
    const wasFavoriteUpdate = Boolean(this._event && this._event.isFavorite !== event.isFavorite);
    this._event = event;

    const prevEventComponent = this._eventComponent;
    const prevEventFormComponent = this._eventFormComponent;

    this._eventComponent = new EventView({event});
    this._eventFormComponent = new FormEventView({
      event,
      destinations: this._destinations,
      offers: this._offers,
    });

    this._initListeners();

    if (!prevEventComponent || !prevEventFormComponent) {
      renderElement(
          this._containerNode,
          this._eventComponent,
          RenderPosition.BEFORE_END
      );

      return;
    }

    switch (this._eventMode) {
      case EventMode.PREVIEW: {
        replaceWithElement(prevEventComponent, this._eventComponent);
        break;
      }
      case EventMode.EDIT: {
        replaceWithElement(
            prevEventFormComponent,
            wasFavoriteUpdate ? this._eventFormComponent : this._eventComponent
        );

        if (!wasFavoriteUpdate) {
          this._eventMode = EventMode.PREVIEW;
        }
        break;
      }
    }

    removeElement(prevEventComponent);
    removeElement(prevEventFormComponent);
  }

  destroy() {
    removeElement(this._eventComponent);
    removeElement(this._eventFormComponent);
  }

  setViewState(state) {
    const resetFormState = () => {
      this._eventFormComponent.updateData({
        isDisabled: false,
        isSaving: false,
        isDeleting: false
      });
    };

    switch (state) {
      case EventState.SAVING: {
        this._eventFormComponent.updateData({
          isDisabled: true,
          isSaving: true
        });
        break;
      }
      case EventState.DELETING: {
        this._eventFormComponent.updateData({
          isDisabled: true,
          isDeleting: true
        });
        break;
      }
      case EventState.ABORTING: {
        this._eventComponent.shake(resetFormState);
        this._eventFormComponent.shake(resetFormState);
        break;
      }
    }
  }

  resetView() {
    if (this._eventMode !== EventMode.PREVIEW) {
      this._replaceFormWithEvent();
    }
  }

  _initListeners() {
    this._eventComponent.setOnEditClick(this._editEvent);
    this._eventFormComponent.setOnSubmit(this._submitForm);
    this._eventFormComponent.setOnDeleteClick(this._deleteEvent);
    this._eventFormComponent.setOnFavoriteChange(this._addToFavorite);
    this._eventFormComponent.setOnCloseClick(this._closeFormEvent);
  }

  _replaceEventWithForm() {
    replaceWithElement(this._eventComponent, this._eventFormComponent);

    this._changeEventMode();
    this._eventMode = EventMode.EDIT;
  }

  _replaceFormWithEvent() {
    replaceWithElement(this._eventFormComponent, this._eventComponent);

    document.removeEventListener(`keydown`, this._onEscKeyDown);

    this._eventMode = EventMode.PREVIEW;
  }

  _editEvent() {
    this._replaceEventWithForm();

    document.addEventListener(`keydown`, this._onEscKeyDown);
  }

  _deleteEvent(event) {
    this._changeEvent(UserAction.DELETE_EVENT, UpdateType.MINOR, event);
  }

  _submitForm(updatedEvent) {
    const isPatchUpdate = checkIsDateEqual(this._event.start, updatedEvent.start)
      & checkIsDateEqual(this._event.end, updatedEvent.end);

    this._changeEvent(
        UserAction.UPDATE_EVENT,
        isPatchUpdate ? UpdateType.PATCH : UpdateType.MINOR,
        updatedEvent
    );
  }

  _addToFavorite() {
    const updatedEvent = Object.assign({}, this._event, {
      isFavorite: !this._event.isFavorite,
    });

    this._changeEvent(
        UserAction.UPDATE_EVENT,
        UpdateType.PATCH,
        updatedEvent
    );
  }

  _onEscKeyDown(evt) {
    if (evt.key === KeyboardKey.ESCAPE) {
      evt.preventDefault();

      this._closeFormEvent();
    }
  }

  _closeFormEvent() {
    this._eventFormComponent.reset(this._event);

    this._replaceFormWithEvent();
  }
}

export default Event;
