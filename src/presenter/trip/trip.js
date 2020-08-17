import {
  renderElement,
  replaceWithElement,
  getUniqueTripDays,
  getSortedDates,
  getFixedDate,
  getUniqueCities,
  getSortedEventsByPrice,
  getSortedEventsByDuration
} from '~/helpers';
import {
  RenderPosition,
  EventSortType,
  KeyboardKey,
  SortOrder,
} from '~/common/enums';
import NoEventsView from '~/view/no-events/no-events';
import SortView from '~/view/sort/sort';
import TripDaysView from '~/view/trip-days/trip-days';
import TripDayView from '~/view/trip-day/trip-day';
import FormEventView from '~/view/form-event/form-event';
import EventView from '~/view/event/event';

const sorts = Object.values(EventSortType);

class Trip {
  constructor(boardContainerNode) {
    this._boardContainerNode = boardContainerNode;
    this._currentSortType = EventSortType.EVENT;

    this._noEventsComponent = new NoEventsView();
    this._sortComponent = new SortView(sorts);
    this._tripDaysComponent = new TripDaysView();

    this._changeSortType = this._changeSortType.bind(this);
  }

  _renderTripDays(events) {
    const tripDays = getUniqueTripDays(events);
    const sortedStartDays = getSortedDates(SortOrder.ASC, tripDays.start);

    sortedStartDays.forEach((day, idx) => {
      const tripDayNumber = idx + 1;
      const eventsByDay = events.filter((event) => {
        const isMathDate = getFixedDate(event.start).getTime() === getFixedDate(day).getTime();

        return isMathDate;
      });

      this._renderTripDay(eventsByDay, day, tripDayNumber);
    });
  }

  _sortEvents(sortType) {
    switch (sortType) {
      case EventSortType.TIME: {
        const sortedEvents = getSortedEventsByDuration(SortOrder.ASC, this._tripEvents);

        this._renderTripDay(sortedEvents);
        break;
      }
      case EventSortType.PRICE: {
        const sortedEvents = getSortedEventsByPrice(SortOrder.DESK, this._tripEvents);

        this._renderTripDay(sortedEvents);
        break;
      }
      default:
        this._renderTripDays(this._tripEvents);
    }

    this._currentSortType = sortType;
  }

  _renderEvent(dayNode, event) {
    const eventComponent = new EventView(event);
    const eventFormComponent = new FormEventView(event, this._tripCities);

    const onEscKeyDown = (evt) => {
      if (evt.key === KeyboardKey.ESCAPE) {
        evt.preventDefault();

        replaceWithElement(eventFormComponent, eventComponent);

        document.removeEventListener(`keydown`, onEscKeyDown);
      }
    };

    eventComponent.setOnEditClick(() => {
      replaceWithElement(eventComponent, eventFormComponent);

      document.addEventListener(`keydown`, onEscKeyDown);
    });

    eventFormComponent.setOnSubmit(() => {
      replaceWithElement(eventFormComponent, eventComponent);

      document.removeEventListener(`keydown`, onEscKeyDown);
    });

    renderElement(dayNode, eventComponent, RenderPosition.BEFORE_END);
  }

  _renderNoEvents() {
    renderElement(this._boardContainerNode, this._noEventsComponent, RenderPosition.BEFORE_END);
  }

  _renderSorts() {
    renderElement(this._boardContainerNode, this._sortComponent, RenderPosition.BEFORE_END);

    this._sortComponent.setOnSortTypeChange(this._changeSortType);
  }

  _renderTripDaysList() {
    renderElement(this._boardContainerNode, this._tripDaysComponent, RenderPosition.BEFORE_END);
  }

  _clearTripDaysList() {
    this._tripDaysComponent.node.innerHTML = ``;
  }

  _renderTripDay(events, day, dayNumber) {
    const tripDayComponent = new TripDayView(day, dayNumber);
    const eventsListNode = tripDayComponent.node.querySelector(`.trip-events__list`);

    renderElement(this._tripDaysComponent, tripDayComponent, RenderPosition.BEFORE_END);

    events.forEach((it) => this._renderEvent(eventsListNode, it));
  }

  _renderTrip() {
    const hasEvents = Boolean(this._initialTasks.length);

    if (!hasEvents) {
      this._renderNoEvents();

      return;
    }

    this._renderSorts();
    this._renderTripDaysList();
    this._renderTripDays(this._tripEvents);
  }

  _changeSortType(sortType) {
    if (this.currentSortType === sortType) {
      return;
    }

    this._clearTripDaysList();
    this._sortEvents(sortType);
  }

  init(events) {
    this._tripEvents = events.slice();
    this._initialTasks = events.slice();
    this._tripCities = getUniqueCities(events);

    this._renderTrip();
  }
}

export default Trip;