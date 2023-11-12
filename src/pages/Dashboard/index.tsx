import api from '@/api'
import BaseLayout from '@/components/BaseLayout'
import Card from '@/components/Card/index'
import { RootState } from '@/store'
import { PendingPost } from '@/types'
import { CommentOutlined, FlagOutlined, MoreOutlined, SaveOutlined } from '@ant-design/icons'
import { useRequest } from 'ahooks'
import { Button, Dropdown, Image, message, Modal, Spin, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import CreateUpdatePost from './components/CreateUpdatePost'
import ModalComment from './components/ModalComment'
import ModalReport from './components/ModalReport'
import ModalSave from './components/ModalSave'
import RightSiderDashboard from './components/RightSiderDashboard'
import SiderDashboard, { FilterType } from './components/SiderDashboard'

export default function Dashboard() {
  const [modal, contextHolder] = Modal.useModal()
  const [openReport, setOpenReport] = useState(false)
  const [openComment, setOpenComment] = useState(false)
  const [openSave, setOpenSave] = useState(false)
  const [openPost, setOpenPost] = useState(false)
  const [idPost, setIdPost] = useState<undefined | number>(undefined)
  const user = useSelector((state: RootState) => state.userReducer.user)
  const navigate = useNavigate()
  const [categories, setCategories] = useState<string | string[] | number | number[] | null>([])
  const [tag, setTags] = useState<string | string[] | number | number[]>([])
  const [filter, setFilter] = useState<FilterType | null>(null)
  const [postFilter, setPostFilter] = useState<PendingPost[] | null>(null)

  const { runAsync: deletePost } = useRequest(api.deletePost, {
    manual: true,
    onSuccess: (res) => {
      if (res) {
        message.success('Delete post success')
        getPost({})
      }
      console.log(res)
    },
    onError: (err) => {
      console.log('vao day')
      console.log(err)
    }
  })

  const renderItem = (id?: number, userId?: number) => {
    return (user?.id ?? 0) === (userId ?? 1)
      ? [
          {
            key: '1',
            label: (
              <div
                onClick={() => {
                  console.log('vao day')
                  setOpenPost(true)
                  setIdPost(id)
                }}
              >
                Update
              </div>
            )
          },
          {
            key: '2',
            label: (
              <div
                className='cursor-pointer w-20 text-red-500'
                onClick={() => {
                  modal.warning({
                    title: 'Warning',
                    content: 'Are you sure to delete?',
                    closable: true,
                    okText: 'Delete',
                    okButtonProps: {
                      danger: true,
                      type: 'primary'
                    },
                    onOk: () => {
                      deletePost(id ?? 0)
                    }
                  })
                }}
              >
                Delete
              </div>
            )
          }
        ]
      : undefined
  }

  const { runAsync: getAllPostHasImages, loading: allPostImgsLoading } = useRequest(api.allPostHasImages, {
    manual: true,
    onSuccess: (res) => {
      if (res) {
        setPostFilter(res)
      }
      console.log(res)
    },
    onError: (err) => {
      console.log(err)
    }
  })

  const { runAsync: getAllPostHasVideos, loading: allPostVideosLoading } = useRequest(api.allPostHasVideo, {
    manual: true,
    onSuccess: (res) => {
      if (res) {
        setPostFilter(res)
      }
      console.log(res)
    },
    onError: (err) => {
      console.log(err)
    }
  })

  useEffect(() => {
    if (!filter) {
      setPostFilter(null)
    } else if (filter === 'image') {
      getAllPostHasImages(user?.id ?? 0)
    } else {
      getAllPostHasVideos(user?.id ?? 0)
    }
  }, [filter, getAllPostHasImages, getAllPostHasVideos, user])

  useEffect(() => {
    getPost({
      categoryID: !categories ? undefined : (categories as unknown as number[]),
      tagID: !tag ? undefined : (tag as unknown as number[])
    })
  }, [categories, tag])

  const {
    data: postData,
    loading: postLoading,
    run: getPost
  } = useRequest(
    async ({ categoryID, tagID, searchValue }: { categoryID?: number[]; tagID?: number[]; searchValue?: string }) => {
      try {
        const res = await api.postCategoryTag({
          categoryID,
          tagID,
          currentUserId: Number(user?.id ?? 0),
          searchValue
        })
        return res
      } catch (error) {
        console.log(error)
      }
    }
  )

  useEffect(() => {
    if (!user) return
    getPost({})
  }, [user])

  const data = !postFilter ? postData : postFilter

  const filteredPost = useMemo(() => {
    //sort data from createAt
    return data?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [data])

  return (
    <BaseLayout
      showSearch
      onChangeSearch={(value) => {
        getPost({ searchValue: value })
      }}
      rightSider={<RightSiderDashboard />}
      sider={
        <SiderDashboard
          onGetCategories={(data) => {
            setCategories(data)
          }}
          onGetTags={(data) => {
            setTags(data)
          }}
          createPost={() => {
            setOpenPost(true)
            setIdPost(undefined)
          }}
          onFilter={(data) => {
            setFilter(data)
          }}
        />
      }
    >
      <CreateUpdatePost
        isOpen={openPost}
        id={idPost}
        setModal={(value) => {
          setOpenPost(value)
          setIdPost(undefined)
        }}
        onFinish={() => {
          getPost({})
        }}
      />
      <Spin spinning={postLoading || allPostImgsLoading || allPostVideosLoading}>
        {filteredPost?.map((post) => {
          return (
            <div key={post?.id} className='mb-10'>
              <Card
                className='mx-auto'
                onClickAvatar={() => navigate(`/profile/${post?.user?.id}`)}
                user={{
                  username: post?.user?.name,
                  avatar: post?.user?.avatarUrl
                }}
                action={[
                  <div>
                    {user?.id === post?.user?.id ? (
                      <Dropdown
                        menu={{ items: renderItem(post?.id ?? 0, post?.user?.id) }}
                        placement='bottomRight'
                        key={1}
                      >
                        <Button type='text' icon={<MoreOutlined />} shape='circle' />
                      </Dropdown>
                    ) : (
                      ''
                    )}
                  </div>
                ]}
                content={post?.content}
                title={post?.title}
                createDate={dayjs(post.createdAt).format('YYYY-MM-DD')}
                slideContent={[
                  ...(post?.images ?? []).map((image) => (
                    <Image
                      key={image.id}
                      src={image.url}
                      className='w-[1194px] h-[620px]'
                      placeholder='https://i0.wp.com/thinkfirstcommunication.com/wp-content/uploads/2022/05/placeholder-1-1.png?w=1200&ssl=1'
                    />
                  )),
                  ...(post?.videos ?? []).map((video) => (
                    <video controls className='w-full'>
                      <source src={video.url} type='video/mp4' className='object-contain' />
                    </video>
                  ))
                ]}
                footer={
                  user?.role === 'AD'
                    ? []
                    : [
                        // <div key={1} className='flex items-center'>
                        //   <Vote
                        //     vote={Number(post?.upvotes ?? 0) - Number(post?.downvote ?? 0)}
                        //     postId={post.id}
                        //     userId={user?.id}
                        //     downvote={post.downvote}
                        //     upvote={post.upvote}
                        //     onVoteSuccess={() => {
                        //       refresh()
                        //     }}
                        //   />
                        // </div>,
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0 12px'
                          }}
                        >
                          <Tooltip title='Comment' key={2}>
                            <Button
                              icon={<CommentOutlined />}
                              onClick={() => {
                                setOpenComment(true)
                                setIdPost(post?.id)
                              }}
                            >
                              Comment
                            </Button>
                          </Tooltip>
                          <Tooltip title='Save' key={3}>
                            <Button
                              icon={<SaveOutlined />}
                              onClick={() => {
                                setOpenSave(true)
                                setIdPost(post.id)
                              }}
                            >
                              Save
                            </Button>
                          </Tooltip>
                          <Tooltip title='Report' key={4}>
                            <Button
                              icon={<FlagOutlined />}
                              onClick={() => {
                                setOpenReport(true)
                                setIdPost(post?.id)
                              }}
                            >
                              Report
                            </Button>
                          </Tooltip>
                        </div>
                        // <div key={2} className='cursor-pointer'>
                        //   <Typography
                        //     onClick={() => {
                        //       setOpenComment(true)
                        //       setIdPost(post?.id)
                        //     }}
                        //   >
                        //     Comment
                        //   </Typography>
                        // </div>,
                        // <div key={3} className='cursor-pointer'>
                        //   <Typography
                        //     onClick={() => {
                        //       // setOpenComment(true)
                        //       setIdPost(post.id)
                        //       setOpenSave(true)
                        //     }}
                        //   >
                        //     Save
                        //   </Typography>
                        // </div>,
                        // <div key={4} className='flex justify-end'>
                        //   <div
                        //     onClick={() => {
                        //       setOpenReport(true)
                        //       setIdPost(post?.id)
                        //     }}
                        //   >
                        //     <IconReport color={isDarkMode ? '#c78243' : '#bc7838'} />
                        //   </div>
                        // </div>
                      ]
                }
              ></Card>
            </div>
          )
        })}
      </Spin>
      {contextHolder}
      <ModalComment
        idPost={idPost}
        isOpen={openComment}
        setModal={(value) => {
          if (!value) {
            setIdPost(undefined)
          }
          setOpenComment(value)
        }}
      />
      <ModalReport
        idPost={idPost}
        isOpen={openReport}
        setModal={(value) => {
          if (!value) {
            setIdPost(undefined)
          }
          setOpenReport(value)
        }}
      />
      <ModalSave
        open={openSave}
        onClose={() => {
          setIdPost(undefined)
          setOpenSave(false)
        }}
        postId={idPost ?? 0}
      />
    </BaseLayout>
  )
}
