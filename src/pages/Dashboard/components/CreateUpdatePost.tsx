import { Button, Form, Input, Modal, Select, SelectProps, Spin, Typography, message } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { Keyboard, Mousewheel, Navigation, Pagination } from 'swiper/modules'
import IconCircleMinus from '@/assets/images/svg/IconCircleMinus'
import { uploadWithCloudinary } from '@/utils/helpers'
import { useRequest } from 'ahooks'
import api from '@/api'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'

interface CreateUpdatePostProps {
  id?: number
  isOpen: boolean
  setModal?: (value: boolean) => void
  onFinish?: () => void
}

export interface FileData {
  type: 'image' | 'video'
  file: File
}

export interface FileUploaded {
  type: 'image' | 'video'
  url: string
}
export default function CreateUpdatePost({ id, isOpen, setModal, onFinish: onFinishSuccess }: CreateUpdatePostProps) {
  const [isModalOpen, setIsModalOpen] = useState(isOpen)
  const [files, setFiles] = useState<FileData[]>([])
  const [filesUploaded, setFilesUploaded] = useState<FileUploaded[]>([])
  // const [images, setImages] = useState<string[]>([])
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState<SelectProps['options']>([])
  const [tagOptions, setTagOptions] = useState<SelectProps['options']>([])
  const { user } = useSelector((state: RootState) => state.userReducer)

  const { data: categoriesData, loading: categoryLoading } = useRequest(async () => {
    try {
      const res = await api.getAllCategory()
      return res
    } catch (error) {
      console.log(error)
    }
  })

  const { data: tagsData, loading: tagsLoading } = useRequest(async () => {
    try {
      const res = await api.getAllTag()
      return res
    } catch (error) {
      console.log(error)
    }
  })

  const { runAsync: createPost, loading: postLoading } = useRequest(api.createPost, {
    manual: true,
    onSuccess: (res) => {
      if (res) {
        message.success('Create post success')
        setIsModalOpen(false)
        setModal?.(false)
        onFinishSuccess?.()
      }
      console.log(res)
    },
    onError: (err) => {
      console.error(err?.message)
    }
  })

  const { runAsync: updatePost, loading: updatePostLoading } = useRequest(api.updatePost, {
    manual: true,
    onSuccess: (res) => {
      if (res) {
        message.success('Update post success')
        setIsModalOpen(false)
        setModal?.(false)
        onFinishSuccess?.()
      }
      console.log(res)
    },
    onError: (err) => {
      console.error(err?.message)
    }
  })

  const { runAsync: getPostById } = useRequest(api.getPostById, {
    manual: true,
    onSuccess: (res) => {
      console.log('detailpost', res)
      const categories = res.categories?.map((item) => item.id)
      const tagIds = res.tags?.map((item) => item.id)
      form.setFieldValue('title', res?.title)
      form.setFieldValue('content', res?.content)
      form.setFieldValue('categoryIds', categories)
      form.setFieldValue('tagIds', tagIds)

      const filesUpdated: FileData[] = []
      const fileUploads: FileUploaded[] = []

      res?.images?.forEach((item) => {
        fileUploads.push({
          type: 'image',
          url: item.url
        })
        filesUpdated.push({
          type: 'image',
          file: new File([''], 'filename')
        })
      })

      res?.videos?.forEach((item) => {
        fileUploads.push({
          type: 'video',
          url: item.url
        })
        filesUpdated.push({
          type: 'video',
          file: new File([''], 'filename')
        })
      })

      setFiles(fileUploads as unknown as FileData[])
      setFilesUploaded(fileUploads)
    },
    onError: (err) => {
      console.error(err?.message)
    }
  })

  useEffect(() => {
    if (!id) return
    console.log('id', id)
    getPostById({
      postId: id
    }).then()
  }, [getPostById, id])

  useEffect(() => {
    if (!categoriesData) return
    const categories: SelectProps['options'] = categoriesData.map((item) => {
      return {
        label: item.categoryName,
        value: item.id
      }
    })
    setCategoryOptions(categories)
  }, [categoriesData])

  useEffect(() => {
    if (!tagsData) return
    const options: SelectProps['options'] = tagsData.map((item) => {
      return {
        label: item.tagName,
        value: item.id
      }
    })
    setTagOptions(options)
  }, [tagsData])

  useEffect(() => {
    setIsModalOpen(isOpen)
  }, [isOpen])

  const handleOk = () => {
    form.submit()
  }

  const handleCancel = () => {
    form.resetFields()
    setModal?.(false)
    setFiles([])
    setFilesUploaded([])
    setIsModalOpen(false)
  }

  const onFinish = async (value: { title: string; content: string; categoryIds: number[]; tagIds: number[] }) => {
    const imageURLs = filesUploaded.filter((item) => item.type === 'image').map((item) => item.url)
    const videoURLs = filesUploaded.filter((item) => item.type === 'video').map((item) => item.url)
    if (!id) {
      await createPost({
        id: user?.id ?? 0,
        body: {
          ...value,
          imageURLs,
          videoURLs
        }
      })
      return
    }
    await updatePost({
      ...value,
      imageURLs,
      videoURLs,
      postId: id
    })
  }

  const handleChangeImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return
      }
      setLoading(true)
      const newFiles = [...files]
      for (const element of e.target.files) {
        const file = element
        if (file.type.startsWith('image/')) {
          newFiles.push({
            type: 'image',
            file
          })
          const data = await uploadWithCloudinary({ file })
          setFilesUploaded([
            ...filesUploaded,
            {
              type: 'image',
              url: data?.url ?? ''
            }
          ])
        } else if (file.type.startsWith('video/')) {
          newFiles.push({
            type: 'video',
            file
          })
          const data = await uploadWithCloudinary({ file })
          setFilesUploaded([
            ...filesUploaded,
            {
              type: 'video',
              url: data?.url ?? ''
            }
          ])
        }
        setFiles(newFiles)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFile = (index: number) => {
    const cloneFiles = [...files]
    const cloneFilesUploaded = [...filesUploaded]
    cloneFiles.splice(index, 1)
    cloneFilesUploaded.splice(index, 1)
    setFiles(cloneFiles)
    setFilesUploaded(cloneFilesUploaded)
  }

  return (
    <Modal
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      className='min-w-[800px]'
      footer={null}
      confirmLoading={postLoading}
    >
      <Spin spinning={postLoading || updatePostLoading}>
        <Typography.Title level={3} className='text-center mt-3'>
          {id ? 'Update Post' : 'Create Post'}
        </Typography.Title>
        <Form
          form={form}
          onFinish={onFinish}
          name='basic'
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
        >
          <Form.Item name='title' label={'Title'} rules={[{ required: true, message: 'Please input your title!' }]}>
            <Input placeholder='Title' />
          </Form.Item>

          <Form.Item
            name='categoryIds'
            label={'Category'}
            rules={[{ required: true, message: 'Please select your category' }]}
          >
            <Select
              mode='multiple'
              style={{ width: '100%' }}
              placeholder='Category'
              options={categoryOptions}
              loading={categoryLoading}
            />
          </Form.Item>

          <Form.Item name='tagIds' label={'Tag'} rules={[{ required: true, message: 'Please select your tag!' }]}>
            <Select
              mode='multiple'
              style={{ width: '100%' }}
              placeholder='Tag'
              options={tagOptions}
              loading={tagsLoading}
            />
          </Form.Item>
          <div className='w-[100%] pr-4'>
            <Form.Item
              name='content'
              label={'Content of this post'}
              rules={[{ required: true, message: 'Please input your content!' }]}
            >
              <TextArea
                placeholder='Content'
                rows={12}
                style={{
                  width: '100%'
                }}
              />
            </Form.Item>
          </div>
        </Form>

        <Spin spinning={loading}>
          <Swiper
            cssMode={true}
            navigation={true}
            pagination={true}
            mousewheel={true}
            keyboard={true}
            modules={[Navigation, Pagination, Mousewheel, Keyboard]}
            className='my-5'
            slidesPerView={3}
          >
            {filesUploaded?.length ? (
              filesUploaded?.map((slide, index) => (
                <SwiperSlide key={index}>
                  <div className='px-1'>
                    <div className='w-full h-[200px] bg-[#ccc] relative'>
                      <div
                        className='absolute top-2 left-2 z-50 cursor-pointer'
                        onClick={() => handleRemoveFile(index)}
                      >
                        <IconCircleMinus color='#e31238' />
                      </div>
                      {slide.type === 'image' ? (
                        <img src={slide.url} alt='' className='w-full h-full object-contain' />
                      ) : (
                        <div className='flex items-center justify-center h-full overflow-hidden'>
                          <video controls>
                            <source src={slide.url} type='video/mp4' className='w-full h-full object-contain' />
                          </video>
                        </div>
                      )}
                    </div>
                  </div>
                </SwiperSlide>
              ))
            ) : (
              <Typography>No file upload</Typography>
            )}
          </Swiper>
        </Spin>
        <div className='text-center flex justify-between'>
          <Button type='primary' className='relative'>
            Add Image/Video
            <input
              className='absolute opacity-0 w-full h-full top-0 left-0'
              type='file'
              onChange={handleChangeImage}
            ></input>
          </Button>

          {/* <div className='text-right'> */}
          <Button onClick={form.submit} type='primary'>
            {id ? 'Update' : 'Create'}
          </Button>
          {/* </div> */}
        </div>
      </Spin>
    </Modal>
  )
}
