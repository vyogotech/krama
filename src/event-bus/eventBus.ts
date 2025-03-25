import mitt from 'mitt';

type Events = {
  refreshGantt: any; // Define event name and payload type
};

export const eventBus = mitt<Events>();
