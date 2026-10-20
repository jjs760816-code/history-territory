import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'잼스의 역사 영토전',description:'문제를 만들고 풀며 함께 넓히는 한반도 역사 학습 게임'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ko"><body>{children}</body></html>}
