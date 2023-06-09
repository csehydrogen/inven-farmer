# inven-farmer

[광고 클릭](https://www.inven.co.kr/board/overwatch/4538/2161610), 불로소득 스킬, [아이마블](https://imart.inven.co.kr/imarble/), [출석체크](https://imart.inven.co.kr/attendance/)를 자동으로 해주는 인벤 레벨업 매크로입니다.

## 다운로드

[배포](https://github.com/csehydrogen/inven-farmer/releases)에서 최신 exe를 다운받아 실행합니다. Signing이 되어 있지 않아 경고가 뜰 수 있습니다.

## 사용법

* 인벤 아이디와 비밀번호를 적고 login 버튼을 눌러 올바르게 로그인 되는지 테스트한다.
  * `{"LOGIN":true}`라고 뜨면 정상적으로 로그인 된 것이다.
  * 이 앱은 어떠한 방식으로도 아이디와 비밀번호를 수집하지 않습니다.
* Scan list에 돌아다닐 게시판을 입력한다. 기본으로 입력된 게시판이면 충분할 것이다.
  * 예) lostark.inven.co.kr -> lostark
* run_macro를 누른다.
* 중단하려면 인터넷 창을 종료한다.
* Last scan은 마지막으로 게시판을 스캔한 시간이다.
  * 이 시간이 1분 이상 지났다면 매크로가 중지된 것이므로 다시 로그인하거나 재시작해야한다.
* Last exp는 마지막으로 경험치를 얻은 시간이다간
  * 하루에 얻을 수 있는 경험치는 제한이 있으므로 이 시간은 오래 지났을 수 있다.
* 나머지는 각각 아이마블, 출석체크, 불로소득을 마지막으로 접근한 시각이다.
  * 매크로 시작할 때 한번 접근하고, 이후 1000 스캔마다 한번씩 접근한다.

## Development

```
$env:GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN'
npm run publish
```
