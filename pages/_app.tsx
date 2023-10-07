import { SWRConfig } from 'swr'
import '../styles/globals.css'
import type { AppProps } from 'next/app'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SWRConfig value={{ fetcher }}>
      <Component {...pageProps} />
    </SWRConfig>
  )
}
