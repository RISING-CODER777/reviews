import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faCheck, faTimes, faTrash, faReply } from "@fortawesome/free-solid-svg-icons";
import { useState, ChangeEvent, FormEvent } from "react";
import type { NextPage } from "next";
import useSWR, { mutate } from "swr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";
export const supabase = createClient(supabaseUrl, supabaseKey);

interface CommentParams {
  id: string;
  created_at: string;
  updated_at: string;
  username: string;
  payload: string;
  reply_of?: string;
}

interface EditCommentParams {
  id: string;
  payload: string;
}

const fetcher = (url: string) => fetch(url, { method: "GET" }).then((res) => res.json());

const addCommentRequest = (url: string, data: any) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());

const editCommentRequest = (url: string, data: any) =>
  fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());

const deleteCommentRequest = (url: string, id: string) =>
  fetch(`${url}?comment_id=${id}`, { method: "DELETE" }).then((res) => res.json());

const Home: NextPage = () => {
  const { data: commentList, error: commentListError, mutate: mutateCommentList } =
    useSWR<CommentParams[]>("/api/comments", fetcher);

  const [comment, setComment] = useState<string>("");
  const [editComment, setEditComment] = useState<EditCommentParams>({ id: "", payload: "" });
  const [replyOf, setReplyOf] = useState<string | null>(null);

  const onChangeEditComment = (event: ChangeEvent<HTMLInputElement>) => {
    const payload = event.target.value;
    setEditComment({ ...editComment, payload });
  };

  const confirmEdit = async () => {
    const editData = {
      payload: editComment.payload,
      commentId: editComment.id,
    };
    if (typeof commentList !== "undefined") {
      mutate(
        "api/comments",
        commentList.map((comment) => {
          if (comment.id === editData.commentId) {
            return { ...comment, payload: editData.payload };
          }
        }),
        false
      );
      const response = await editCommentRequest("api/comments", editData);
      console.log(response);
      if (response && response[0]?.created_at) {
        mutate("api/comments");
        window.alert("Hooray!");
        setEditComment({ id: "", payload: "" });
      }
    }
  };

  const confirmDelete = async (id: string) => {
    const ok = window.confirm("Delete comment?");
    if (ok && typeof commentList !== "undefined") {
      mutate(
        "/api/comments",
        commentList.filter((comment) => comment.id !== id),
        false
      );

      const response = await deleteCommentRequest("/api/comments", id);
      if (response && response[0]?.created_at) {
        mutate("/api/comments");
        window.alert("Deleted Comment :)");
      }
    }
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const commentValue = event.target.value;
    setComment(commentValue);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { data, error } = await supabase.from("comments").insert({
      username: "cp@email.com",
      payload: comment,
      reply_of: replyOf,
    });
    if (!error && data) {
      window.alert("Hooray!");
      setComment("");
      mutateCommentList();
    } else {
      window.alert(error?.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <form onSubmit={onSubmit} style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
        <div style={{ width: '100%' }}>
          {replyOf && (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'start' }}>
              <p style={{ fontSize: '12px', fontStyle: 'italic', color: '#777' }}>
                Reply of: {commentList?.find((comment) => comment.id === replyOf)?.payload ?? ""}
              </p>
              <button onClick={() => setReplyOf(null)} style={{ fontSize: '12px', fontStyle: 'italic', color: '#777', background: 'none', border: 'none' }}>
                Cancel
              </button>
            </div>
          )}
<div className="w-full flex justify-between items-center mb-4"></div>
<input
    onChange={onChange}
    type="text"
    placeholder="Add a Review"
    className="p-2 border-b focus:border-b-gray-700 w-3/4 outline-none"
    value={comment}
  />
  <button
    type="submit"
    style={{
      padding: '5px',
      backgroundColor: '#4caf50',
      borderRadius: '5px',
      color: 'white',
      marginLeft: '10px',
      border: 'none'
    }}
  >
    Submit
  </button>
        </div>
      </form>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px' }}>
        {(commentList ?? [])
          .sort((a, b) => {
            const aDate = new Date(a.created_at);
            const bDate = new Date(b.created_at);
            return +aDate - +bDate;
          })
          .map((comment) => (
            <div key={comment.id} style={{ display: 'flex', flexDirection: 'column', border: 'none', borderRadius: '5px', width: '100%', padding: '10px', backgroundColor: 'white' }}>
              {comment.reply_of && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '2' }}>
                  <FontAwesomeIcon icon={faReply} style={{ width: '16px', color: '#777', transform: 'rotate(180deg)' }} />
                  <p style={{ fontStyle: 'italic', color: '#777', fontSize: '16px', background: 'none' }}>
                    {commentList?.find((c) => c.id === comment.reply_of)?.payload ?? ""}
                  </p>
                </div>
              )}
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                {comment.username}
                {comment.updated_at !== comment.created_at && (
                  <span style={{ marginLeft: '4px', fontSize: '12px', fontStyle: 'italic', color: '#777' }}>edited</span>
                )}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                {comment.id === editComment.id ? (
                  <input
                    type="text"
                    value={editComment.payload}
                    onChange={onChangeEditComment}
                    style={{ padding: '4px', borderBottom: '1px solid #000', width: '100%' }}
                  />
                ) : (
                  <p style={{ background: 'none' }}>{comment.payload}</p>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {editComment.id === comment.id ? (
                    <>
                      <button type="button" onClick={confirmEdit} style={{ fontSize: '16px', color: '#4caf50', background: 'none', border: 'none' }}>
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditComment({ id: "", payload: "" })}
                        style={{ fontSize: '16px', color: '#777', background: 'none', border: 'none' }}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditComment({ id: comment.id, payload: comment.payload })}
                        style={{ fontSize: '16px', color: '#4caf50', background: 'none', border: 'none' }}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDelete(comment.id)}
                        style={{ fontSize: '16px', color: '#f44336', background: 'none', border: 'none' }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplyOf(comment.id)}
                        style={{ fontSize: '16px', color: '#ff9800', background: 'none', border: 'none' }}
                      >
                        <FontAwesomeIcon icon={faReply} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Home;
