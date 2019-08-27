import React from "react";
import { Icon, Button, Input, Upload, message, Checkbox } from "antd";
import parse from "html-react-parser";
import { EditorState, convertToRaw, ContentState } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import draftToHtml from "draftjs-to-html";
import htmlToDraft from "html-to-draftjs";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

import {
  makeTimeBeautiful,
  IS_CONSOLE_LOG_OPEN
} from "../../utils/constants/constants";
import { apiRoot, BLOGS } from "../../utils/constants/endpoints";
import { axiosCaptcha } from "../../utils/api/fetch_api";

import "./style.scss";

const { TextArea } = Input;

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener("load", () => callback(reader.result));
  reader.readAsDataURL(img);
}

function beforeUpload(file) {
  const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
  if (!isJpgOrPng) {
    message.error("You can only upload JPG/PNG file!");
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error("Image must smaller than 2MB!");
  }
  return isJpgOrPng && isLt2M;
}

class BlogEditable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLinkDisplaying: false,
      content: this.props.blog.content,
      created_at: this.props.blog.created_at,
      updated_at: this.props.blog.updated_at,
      downvote: this.props.blog.downvote,
      header_image: this.props.blog.header_image,
      id: this.props.blog.id || null,
      is_publish: this.props.blog.is_publish,
      is_approved: this.props.blog.is_approved,
      is_publish: this.props.blog.is_publish,
      is_public: this.props.blog.is_public,
      title: this.props.blog.title,
      upvote: this.props.blog.upvote,
      view_count: this.props.blog.view_count,
      voted: this.props.blog.voted,
      snippet: this.props.blog.snippet,
      publisher: this.props.blog.publisher_profile,
      isEditingTitle: true,
      isEditingSnippet: true,
      isEditingContent: false,
      upVoted: false,
      downVoted: false,
      editorState: EditorState.createEmpty(),
      loading: false,
      fromData: new FormData()
    };

    this.toggleEditable = this.toggleEditable.bind(this);
    this.onEditorStateChange = this.onEditorStateChange.bind(this);
    this.handlePhotoUpdate = this.handlePhotoUpdate.bind(this);
    this.saveBlogData = this.saveBlogData.bind(this);
    this.postBlogData = this.postBlogData.bind(this);
    this.handlePublicCheckbox = this.handlePublicCheckbox.bind(this);
  }

  componentDidMount() {
    const contentBlock = htmlToDraft(this.state.content);
    if (contentBlock) {
      const contentState = ContentState.createFromBlockArray(
        contentBlock.contentBlocks
      );
      const editorState = EditorState.createWithContent(contentState);
      this.setState({
        editorState: editorState
      });
    }
  }

  async postBlogData() {
    await this.setState({ is_publish: true });
    this.saveBlogData();
  }

  async saveBlogData() {
    const {
      id,
      fromData,
      title,
      snippet,
      content,
      is_publish,
      is_public
    } = this.state;
    let config = id == null ? { method: "POST" } : { method: "PUT" };
    fromData.append("title", title);
    fromData.append("snippet", snippet);
    fromData.append("content", content);
    fromData.append("is_publish", is_publish);
    fromData.append("is_public", is_public);
    if (config.method == "PUT") {
      fromData.append("blog_id", id);
    }
    config.body = fromData;
    config.headers = {};
    config.headers["Content-Type"] = "multipart/form-data";
    let response = await axiosCaptcha(BLOGS, config);
    if (response.statusText === "OK") {
      if (response.data.success === true) {
        let update_date = new Date().toISOString();
        this.setState({
          id: response.data.data.id,
          updated_at: update_date,
          is_publish: false
        });
        !is_publish
          ? this.props.alert(3000, "success", "Saved!")
          : this.props.alert(
              3000,
              "success",
              "Your blog has been sent for approval! Approval procedure may take several days!"
            );
        if (config.method == "POST") {
          let create_date = new Date().toISOString();
          this.setState({
            created_at: create_date
          });
        }
        IS_CONSOLE_LOG_OPEN && console.log("done!");
      }
    }
  }

  toggleEditable(type) {
    this.setState({
      [type]: !this.state[type]
    });
  }

  handlePublicCheckbox(e) {
    this.setState({ is_public: !e.target.checked, is_publish: false });
  }

  onChange(event) {
    event.persist();
    let type = event.target.id;
    let value = event.target.value;
    this.setState({ [type]: value, is_publish: false });
  }

  handlePhotoUpdate(file) {
    let bodyFormData = new FormData();
    bodyFormData.append("header_image", file);
    this.setState({ fromData: bodyFormData });
    getBase64(file, imageUrl =>
      this.setState({
        header_image: imageUrl,
        loading: false,
        is_publish: false
      })
    );
  }

  onEditorStateChange(editorState) {
    let html = draftToHtml(convertToRaw(editorState.getCurrentContent()));
    this.setState({
      editorState: editorState,
      content: html,
      is_publish: false
    });
  }

  generateBlogHeader() {
    const {
      content,
      created_at,
      title,
      view_count,
      snippet,
      publisher,
      isEditingTitle,
      isEditingSnippet
    } = this.state;
    let photoUrl =
      publisher.profile_photo.substring(0, 4) == "http"
        ? publisher.profile_photo
        : apiRoot + publisher.profile_photo;
    let time = makeTimeBeautiful(created_at, "dateandtime");
    let longDate = makeTimeBeautiful(created_at, "longDate");
    let joinDate = makeTimeBeautiful(publisher.date_joined, "longDate");
    return (
      <div className="blog-header">
        <div className="blog-datebox">
          <div className="day">{time.split("-")[0]}</div>
          <div className="month">{time.split("-")[1].toUpperCase()}</div>
        </div>
        <div className="blog-info">
          <div>
            {isEditingTitle ? (
              <div
                style={{
                  width: 668,
                  overflow: "hidden",
                  borderBottomRightRadius: 36
                }}
              >
                <TextArea
                  placeholder="Add title..."
                  autosize={{ minRows: 1, maxRows: 2 }}
                  style={{
                    border: "none",
                    boxShadow: "none",
                    padding: 0,
                    minWidth: 668
                  }}
                  className="title"
                  id="title"
                  value={title}
                  onChange={e => this.onChange(e)}
                />
              </div>
            ) : (
              <div className="title">{title}</div>
            )}
          </div>
          <div className="snippet">
            {isEditingSnippet ? (
              <div
                style={{
                  width: 668,
                  overflow: "hidden",
                  borderBottomRightRadius: 60
                }}
              >
                <TextArea
                  placeholder="Add snippet..."
                  autosize={{ minRows: 2, maxRows: 4 }}
                  style={{
                    border: "none",
                    boxShadow: "none",
                    padding: 0,
                    minWidth: 668
                  }}
                  className="snippet"
                  id="snippet"
                  value={snippet}
                  onChange={e => this.onChange(e)}
                />
              </div>
            ) : (
              <div className="snippet">{snippet}</div>
            )}
          </div>
          <div className="info-container">
            <div className="info">
              {longDate + " at " + time.split("at")[1]}
            </div>
            <div className="info">
              <Icon type="dashboard" />
              {" " + Math.round(content.split(" ").length / 200, 0) + " min"}
            </div>
            <div className="info">
              <Icon type="read" />
              {" " + view_count}
            </div>
          </div>
          <div className="author-info">
            <div className="author-photo">
              <img src={photoUrl} />
            </div>
            <div className="author-details">
              <div>
                <div className="name">
                  <div>Author</div>
                  <div className="author-name">
                    {publisher.first_name + " " + publisher.last_name}
                  </div>
                </div>
                <div className="details-container">
                  <div>
                    {"joined" +
                      joinDate.split(",")[1] +
                      "," +
                      joinDate.split(",")[2]}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  generateBlogBody() {
    const {
      content,
      downvote,
      header_image,
      upvote,
      isEditingContent,
      upVoted,
      downVoted,
      editorState
    } = this.state;
    const upVoteType = upVoted ? "primary" : "";
    const downVoteType = downVoted ? "primary" : "";
    const uploadButton = (
      <div
        style={{
          width: 1000,
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <div>
          <Icon type={this.state.loading ? "loading" : "plus"} />
          <div className="ant-upload-text">Upload</div>
        </div>
      </div>
    );
    const image =
      header_image.substring(0, 4) == "data"
        ? header_image
        : apiRoot + header_image;
    return (
      <div className="blog-body">
        <div className="blog-data">
          <div className="blog-photo">
            <Upload
              name="avatar"
              listType="picture-card"
              className="avatar-uploader"
              style={{ width: 1068, height: 436 }}
              showUploadList={false}
              beforeUpload={beforeUpload}
              action={file => this.handlePhotoUpdate(file)}
            >
              {header_image != "" ? (
                <img src={image} alt="avatar" style={{ width: "100%" }} />
              ) : (
                uploadButton
              )}
            </Upload>
          </div>
          <div className="details-container">
            {isEditingContent ? (
              <div>
                <div
                  style={{
                    width: 668,
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: 12
                  }}
                >
                  <Button
                    onClick={() => this.setState({ isEditingContent: false })}
                  >
                    {" "}
                    Close Editor{" "}
                  </Button>
                </div>
                <Editor
                  editorState={editorState}
                  toolbarClassName="toolbar"
                  wrapperClassName="demo-wrapper"
                  editorClassName="demo-editor editor"
                  onEditorStateChange={this.onEditorStateChange}
                />
              </div>
            ) : (
              <div
                className="details"
                onClick={() => this.setState({ isEditingContent: true })}
              >
                {content == "" ? (
                  <div style={{ minHeight: 440 }}>Add content...</div>
                ) : content.length == 8 ? (
                  <div style={{ minHeight: 440 }}>Add content...</div>
                ) : (
                  parse(`${content}`)
                )}
              </div>
            )}
          </div>
          <div>
            <div className="engagement">
              <div className="engagement-container">
                <div className="button">
                  <Button
                    type={upVoteType}
                    shape="circle"
                    onClick={() =>
                      this.setState({
                        downvote: 0,
                        downVoted: false,
                        upVoted: true,
                        upvote: 1
                      })
                    }
                  >
                    <Icon type="like" />
                  </Button>
                  <div className="engagement-amount">
                    {upvote == 0 ? "Give the first like!" : upvote + " likes"}
                  </div>
                </div>
                <div className="button">
                  <Button
                    type={downVoteType}
                    shape="circle"
                    onClick={() =>
                      this.setState({
                        downvote: 1,
                        downVoted: true,
                        upVoted: false,
                        upvote: 0
                      })
                    }
                  >
                    <Icon type="dislike" />
                  </Button>
                  <div className="engagement-amount">
                    {downvote == 0 ? "No dislike!" : downvote + " dislikes"}
                  </div>
                </div>
              </div>
              <div className="share-container">Share Link</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const {
      content,
      title,
      snippet,
      header_image,
      updated_at,
      is_public
    } = this.state;
    const { blog } = this.props;
    const isAnytingEdited =
      content != blog.content ||
      title != blog.title ||
      snippet != blog.snippet ||
      header_image != blog.header_image ||
      is_public != blog.is_public;
    const isRequiredFieldsFilled = content && title && snippet && header_image;
    history.pushState(null, null, location.href);
    window.onpopstate = function() {
      window.location.assign("blogs");
    };
    return (
      <div className="blog-details">
        <div className="fixed-button" style={{ boxShadow: "none" }}>
          <div className="fixed-button" style={{ boxShadow: "none" }}>
            {isAnytingEdited && (
              <Button
                type="primary"
                shape="circle"
                size="large"
                onClick={() => this.saveBlogData()}
              >
                <Icon type="save" />
              </Button>
            )}

            {isAnytingEdited && isRequiredFieldsFilled && (
              <Button
                type="primary"
                style={{ margin: "0 0 0 8px" }}
                onClick={() => this.postBlogData()}
              >
                Send for Approval
              </Button>
            )}
          </div>
          {isRequiredFieldsFilled && (
            <div
              className="fixed-button"
              style={{ boxShadow: "none", margin: "48px 0 0 0" }}
            >
              <Checkbox
                checked={!this.state.is_public}
                onChange={e => this.handlePublicCheckbox(e)}
              >
                Share only with school
              </Checkbox>
            </div>
          )}
          {updated_at && (
            <div
              className="no-data"
              style={{ boxShadow: "none", margin: "80px 8px 0 0" }}
            >
              {"last update " +
                makeTimeBeautiful(this.state.updated_at, "dateandtime")}
            </div>
          )}
        </div>
        {this.generateBlogHeader()}
        {this.generateBlogBody()}
      </div>
    );
  }
}

export default BlogEditable;
