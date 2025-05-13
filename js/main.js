import EventBus from "./utils/EventBus";
window.EventBus = EventBus; // event bus 글로벌로 등록, event 발행 구독하면서 모듈 간 통신 역할.
import WebGL from "./modules/WebGL";


if(!window.isDev) window.isDev = false;

const webglMng = new WebGL({
    $wrapper: document.body
}); // new webgl 객체를 document.body에 붙임.