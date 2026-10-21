# 역사 땅따먹기 문제은행

## 구성
- 9개 게임용 범위 × 200문항 = 1,800문항.
- 범위별 4지선다 180문항 / OX 20문항. OX는 참 10, 거짓 10.
- 한 범위의 핵심 주제 50개를 설명 읽기, 개념 이해, 연결·비교 등 서로 다른 활동으로 다룬다. 1,800개의 서로 다른 역사 사실을 뜻하지는 않는다.
- 같은 문항 문자열, 공백을 제외한 같은 질문, 중복 ID, 중복 보기, 잘못된 정답 인덱스를 검사한다. 개념은 복습을 위해 다시 등장할 수 있다.
- 정답과 해설, 참고 URL, 학년, 범위, 관련 성취기준을 저장한다.
- `questions.json`: 종전 200문항 및 주제의 출처. 기존 방의 문제를 변경하는 용도가 아니다.
- `history-facts.txt`: 보충 주제와 설명. `history-ox.txt`: 직접 작성한 OX 판단·오개념·자료 해석 문항.
- `scripts/build-question-bank.mjs`: 위 자료로 실제 `question-bank.json`을 만드는 재현 가능한 편성 도구.

## 교육과정 확인
교육부 고시 제2022-33호 사회과 교육과정(별책 7) 및 교육청의 2022 개정 교육과정 자료를 참고했다. 국가교육과정은 5~6학년군 성취기준을 제시한다. 이 게임의 9개 범위는 수업 편의를 위한 역사 시기별 구분이며 공식 교과서의 9개 단원이라는 뜻은 아니다.

- 선사·고조선: 6사04-01, 유물·유적으로 생활 추론.
- 삼국·가야 / 남북국: 6사04-02, 고대의 기록과 문화유산으로 생각과 생활 추론.
- 고려: 6사04-03, 역사 자료로 사회와 생활 추론.
- 조선 전기: 6사05-01, 유교와 생각·생활의 관계.
- 조선 전쟁·후기 / 개항·대한제국: 6사05-01~02 관련 내용과 보충 역사 맥락.
- 일제 강점기: 6사06-01, 식민 통치·저항과 사회·생활 변화.
- 광복·대한민국: 6사06-02 및 평화·민주주의와 연계한 보충 주제. 관련 코드는 범위 수준의 연계 표시이며 모든 개별 문항이 해당 성취기준 전체를 평가한다는 뜻은 아니다.

확인한 자료:
- 교육부 고시: https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=141&boardSeq=93458&lev=0&m=0404
- 초등 사회과 공통 교육과정 성취기준 자료: https://www.nise.go.kr/ebook/src/viewer/download.php?host=main&no=1&site=20240819_172144
- 인천교육청 2026 수업 평가 자료: https://www.ice.go.kr/upload/ice/na/bbs_1630/2026/02/99349a5278e3ed9b63bb236e6ca06d29.pdf
- 경기도교육청 수업 평가 자료: https://www.goe.go.kr/resource/goe/na/bbs_2675/2026/02/116dc7a4-254a-44fe-9e77-3e908ecc5ff3.pdf

## 역사 내용 참고
국사편찬위원회 우리역사넷의 ‘재미있는 초등역사’를 기본 참고 자료로 사용한다. 시대별 목차 URL은 각 문항의 관련 자료를 찾기 위한 탐색 시작점이다. 추가 확인한 주제별 자료는 다음과 같다.
- 고대: https://contents.history.go.kr/mobile/eh/list.do?code=eh_age_10
- 고려: https://contents.history.go.kr/mobile/eh/list.do?code=eh_age_20
- 조선: https://contents.history.go.kr/mobile/eh/list.do?code=eh_age_30
- 근대: https://contents.history.go.kr/mobile/eh/list.do?code=eh_age_40
- 현대: https://contents.history.go.kr/mobile/eh/list.do?code=eh_age_50
- 발해 문화: https://contents.history.go.kr/mobile/eh/view.do?code=eh_age_10&levelId=eh_r0120_0010
- 발해 성장: https://contents.history.go.kr/mobile/eh/view.do?code=eh_age_10&levelId=eh_r0117_0010
- 조선 건국: https://contents.history.go.kr/mobile/eh/view.do?code=ganada&levelId=eh_r0186_0010
- 태종: https://contents.history.go.kr/mobile/eh/view.do?code=eh_age_30&levelId=eh_n0385_0010
- 개항기 강화도: https://contents.history.go.kr/mobile/eh/view.do?code=eh_age_40&levelId=eh_r0352_0010
- 신문왕: https://contents.history.go.kr/mobile/kc/view.do?levelId=kc_n101240
- 김윤후: https://contents.history.go.kr/mobile/kc/view.do?code=kc_age_20&levelId=kc_n201500
- 제주4·3: https://contents.history.go.kr/mobile/eh/view.do?code=eh_age_50&levelId=eh_r0380_0010

검토 방향: 어려운 관청·행정구역 암기 일부를 생활·문화로 교체했다. 전쟁은 승패와 함께 피란·이산가족·민간인 피해를 다룬다. 건국 이야기는 전승임을 구분하고, 정전과 종전, 신분제의 법적 폐지와 실제 생활 변화 등을 혼동하지 않도록 해설한다. 본 자료는 교사용 보충 게임 문항이며 국가기관의 공식 출제·검정 문항은 아니다.

## 방에 반영하는 규칙
선택 범위의 4지선다에서 180개, OX에서 20개를 중복 없이 뽑고 섞는다. 범위를 여러 개 골라도 총 200개이다. 학생·교사 추가 문제도 설정 범위의 주제와 시대에 맞아야 등록·승인된다. 추가 승인 문제는 기본 200개에 더해지므로 이후 전체 방 문항의 90:10 비율은 달라질 수 있다. 기존 진행 중 방과 저장된 결과는 생성 당시 내용을 유지한다.
