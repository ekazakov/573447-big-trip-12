import {Observer} from '~/helpers';

class Events extends Observer {
  constructor() {
    super();

    this._events = [];
  }

  set events(events) {
    this._events = events.slice();
  }

  get events() {
    return this._events;
  }

  updateEvent(updateType, event) {
    this._events = this._events.map((it) => (it.id === event.id ? event : it));

    this._notify(updateType, event);
  }

  addEvent(updateType, event) {
    this._events = [event, ...this._events];

    this._notify(updateType, event);
  }

  deleteEvent(updateType, event) {
    this._events = this._events.filter((it) => it.id !== event.id);

    this._notify(updateType, event);
  }
}

export default Events;
