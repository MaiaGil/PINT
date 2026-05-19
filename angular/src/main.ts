import 'zone.js'; // <-- Sem isto na Linha 1, o ecrã fica em branco!
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));