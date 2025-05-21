// import EventBus from "./utils/EventBus";
// window.EventBus = EventBus; // event bus 글로벌로 등록, event 발행 구독하면서 모듈 간 통신 역할.
import WebGL from "./modules/WebGL";


if(!window.isDev) window.isDev = false; // is dev 정의되어있지 않으면 개발환경을 끔. (디버그 용 코드드 한번에 꺼버리기)

const webglMng = new WebGL({
    $wrapper: document.body
}); // new webgl 객체를 document.body에 붙임.