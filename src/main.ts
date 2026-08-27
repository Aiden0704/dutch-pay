import './style.css';
import { renderLogin } from './login/ui/login';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('#app 엘리먼트를 찾을 수 없습니다');
}

renderLogin(app);
