import { RootState } from '@/store'
import { setDarkMode } from '@/store/reducers/theme'
import { getLocalStorage, removeLocalStorage, setLocalStorage } from '@/utils/helpers'
import { SearchOutlined } from '@ant-design/icons'
import { UserButton } from '@clerk/clerk-react'
import { ConfigProvider, Flex, Input, Layout, Space, Switch, theme, Typography } from 'antd'
import { PropsWithChildren, ReactNode, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const { Header, Content, Sider, Footer } = Layout

const BaseLayout = ({
  children,
  sider,
  showSearch = false,
  onChangeSearch
}: PropsWithChildren<{
  sider: ReactNode
  rightSider?: ReactNode
  showSearch?: boolean
  onChangeSearch?: (value: string) => void
}>) => {
  // const [isDarkMode, setIsDarkMode] = useState(false)
  const navigate = useNavigate()
  const { defaultAlgorithm, darkAlgorithm } = theme
  const isDarkMode = useSelector((state: RootState) => state.themeReducer.darkMode)
  const dispatch = useDispatch()

  // const matches: RouteObject[] = useMatches()
  // const crumbs = matches
  //   .filter((match) => Boolean(match.handle?.crumb))
  //   .map((match) => match.handle?.crumb(match.handle.data))

  const handleClick = (value: boolean) => {
    if (isDarkMode) {
      removeLocalStorage('dark-mode')
    } else {
      setLocalStorage('dark-mode', true)
    }
    dispatch(setDarkMode(value))
  }

  useEffect(() => {
    const darkMode = getLocalStorage('dark-mode')
    if (!darkMode) {
      dispatch(setDarkMode(false))
      return
    }
    dispatch(setDarkMode(true))
  }, [dispatch])

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
        components: {
          Layout: {
            siderBg: '#141414',
            triggerBg: '#141414',
            bodyBg: isDarkMode ? 'rgb(42, 44, 44)' : '#f5f5f5',
            footerBg: isDarkMode ? 'rgb(42, 44, 44)' : '#f5f5f5'
          },
          Menu: {
            darkItemBg: '#141414'
          },
          Table: {
            colorBgContainer: isDarkMode ? '#262626' : '#FFFFFF',
            headerBg: isDarkMode ? '#434343' : '#FAFAFA'
          }
        }
      }}
    >
      <Layout
        className={isDarkMode ? 'dark' : 'light'}
        style={{
          minHeight: '100vh'
        }}
      >
        <Sider
          breakpoint='lg'
          collapsedWidth='0'
          theme={isDarkMode ? 'dark' : 'light'}
          trigger={null}
          width={300}
          style={{
            overflow: 'auto'
          }}
          className={'fixed-sidebar'}
          onBreakpoint={(broken) => {
            console.log(broken)
          }}
          onCollapse={(collapsed, type) => {
            console.log(collapsed, type)
          }}
        >
          <Flex justify='space-between' vertical className='h-full w-full pb-5'>
            <div
              className='cursor-pointer'
              onClick={() => navigate('/')}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '64px',
                paddingTop: 24
              }}
            >
              <Typography.Title level={5}>Dashboard</Typography.Title>
            </div>
            <Flex gap={10} vertical className='w-full px-5 grow mb-5'>
              {sider}
            </Flex>
            <Space size={10} align='center' className='cursor-pointer px-5 flex-none'>
              <UserButton />
              <Typography.Text>Profile</Typography.Text>
            </Space>
            <Space size={10} align='center' className='cursor-pointer px-5 flex-none mt-4'>
              <Switch onChange={(e) => handleClick(e)} checked={!!isDarkMode} />
              <Typography.Text>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</Typography.Text>
            </Space>
          </Flex>
        </Sider>
        <Layout>
          <Header style={{ padding: 24, background: isDarkMode ? '#141414' : '#fff' }}>
            <Flex align='center' gap={24}>
              <Typography.Text
                style={{
                  fontWeight: 600,
                  width: 120
                }}
              >
                My NewFeeds
              </Typography.Text>
              {showSearch && (
                <Input
                  prefix={<SearchOutlined />}
                  placeholder='Search posts here...'
                  onChange={(e) => {
                    onChangeSearch?.(e.target.value)
                  }}
                />
              )}
            </Flex>
          </Header>
          <Layout style={{ paddingTop: 24 }}>
            <Content style={{ margin: '0 16px' }}>{children}</Content>
          </Layout>
          {/*{rightSider && (*/}
          {/*  <Sider width={300} theme={isDarkMode ? 'dark' : 'light'} className='shadow-md'>*/}
          {/*    {rightSider}*/}
          {/*  </Sider>*/}
          {/*)}*/}
          <Footer style={{ textAlign: 'center' }}>Created by SWP - FPT University</Footer>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}

export default BaseLayout
