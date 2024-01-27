"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Switch,
  Spinner,
} from "@nextui-org/react";

import {
  CustomModalType,
  FocusedTodoType,
  Todo,
  SetATodoStateType,
} from "@/types";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { VerticalDotsIcon } from "./icons";

export default function TodosTable({ todos }: { todos: Todo[] }) {
  const [todoAddEnable, setTodoAddEnable] = useState<boolean>(false);
  const [aTodoValue, setATodoValue] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [currentModalData, setCurrentModalData] = useState<FocusedTodoType>({
    focusedTodo: null,
    modalType: "detail",
  });
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const inputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const notifySuccessEvent = (meg: string) => toast.success(meg);

  // 할일 추가 함수
  const addATodoHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (aTodoValue.trim() === "") {
      setError("칸을 비울 수 없습니다.");
      return;
    }

    e.currentTarget.reset();
    // delay
    await new Promise((f) => setTimeout(f, 1000));
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/todos/`,
        {
          method: "post",
          body: JSON.stringify({ title: aTodoValue }),
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("할일 추가에 실패했습니다.");
      }

      // alert 모달창
      notifySuccessEvent("할일이 추가 되었습니다.");

      router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

  // 할일
  const editATodoHandler = async (
    editATodo: Todo,
    setATodoState: SetATodoStateType,
    onClose: () => void
  ) => {
    const { id, title, is_done } = editATodo;
    if (title.trim() === "") {
      setATodoState(null, "칸을 비울 수 없습니다.");
      return;
    }

    setATodoState(true, null);

    // delay
    await new Promise((f) => setTimeout(f, 1000));
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/todos/${id}`,
        {
          method: "post",
          body: JSON.stringify({ title: title, is_done: is_done }),
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("할일 수정에 실패했습니다.");
      }

      // alert 모달창
      notifySuccessEvent("할일이 수정 되었습니다.");
      onClose();
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

  // input에 포커스 체크
  useEffect(() => {
    checkFocus();
  }, [aTodoValue]);

  const checkFocus = () => {
    if (inputRef.current) {
      const isFocused = document.activeElement === inputRef.current;

      if (isFocused && !aTodoValue) {
        setError("할일을 입력해주세요");
      } else {
        setError("");
      }
    }
  };

  const ModalComponent = () => {
    // 할일 수정 함수

    return (
      <Modal backdrop="blur" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) =>
            currentModalData.focusedTodo && (
              <CustomModal
                focusedTodo={currentModalData.focusedTodo}
                modalType={currentModalData.modalType}
                onClose={onClose}
                onEdit={async (editATodo, setATodoState, onClose) => {
                  await editATodoHandler(editATodo, setATodoState, onClose);
                }}
              />
            )
          }
        </ModalContent>
      </Modal>
    );
  };

  return (
    <>
      {/* alert 컴포넌트 */}
      <ToastContainer
        theme="dark"
        pauseOnFocusLoss={false}
        pauseOnHover={false}
        autoClose={2000}
      />
      {/* 할일 추가 폼 */}
      <form
        onSubmit={addATodoHandler}
        className="flex w-full flex-wrap md:flex-nowrap gap-4"
      >
        <Input
          ref={inputRef}
          type="text"
          label="새로운 할일"
          name="todo"
          errorMessage={error}
          onValueChange={(changedInput) => {
            setATodoValue(changedInput);
            setTodoAddEnable(changedInput.length > 0);
          }}
          onBlur={() => checkFocus()}
        />

        <Button
          className="h-auto"
          color={todoAddEnable ? "warning" : "default"}
          type="submit"
        >
          추가
        </Button>
      </form>
      {/* 할일 목록을 표시하는 테이블 */}
      <Table aria-label="Example static collection table">
        <TableHeader>
          <TableColumn>아이디</TableColumn>
          <TableColumn>할일 내용</TableColumn>
          <TableColumn>완료 여부</TableColumn>
          <TableColumn>생성일</TableColumn>
          <TableColumn>액션</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"새로운 루틴을 추가하세요."}>
          {todos &&
            todos.map((aTodo) => (
              <TableRow key={aTodo.id}>
                <TableCell>{aTodo.id.slice(0, 4)}</TableCell>
                <TableCell>{aTodo.title}</TableCell>
                <TableCell>{aTodo.is_done ? "완료" : "아직"}</TableCell>
                <TableCell>{aTodo.created_at}</TableCell>
                <TableCell>
                  <div className="relative flex justify-end items-center gap-2">
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                          <VerticalDotsIcon className="text-default-300" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label="할일 옵션"
                        onAction={(key) => {
                          onOpen();
                          setCurrentModalData({
                            focusedTodo: aTodo,
                            modalType: key as CustomModalType,
                          });
                        }}
                      >
                        <DropdownItem key="detail">View</DropdownItem>
                        <DropdownItem key="edit">Edit</DropdownItem>
                        <DropdownItem key="delete">Delete</DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      {/* 상세보기 모달 */}
      {ModalComponent()}
    </>
  );
}

const CustomModal = ({
  focusedTodo,
  modalType,
  onClose,
  onEdit,
}: {
  focusedTodo: Todo;
  modalType: CustomModalType;
  onClose: () => void;
  onEdit: (
    editATodo: Todo,
    setATodoState: SetATodoStateType,
    onClose: () => void
  ) => void;
}) => {
  const detailModal = () => {
    return (
      <>
        <ModalHeader className="flex flex-col gap-1">{modalType}</ModalHeader>
        <ModalBody>
          <p>{modalType}</p>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Close
          </Button>
          <Button color="primary" onPress={onClose}>
            Actio n
          </Button>
        </ModalFooter>
      </>
    );
  };

  const editModal = () => {
    // 수정된 할일 입력
    const [editedTodoTitle, setEditedTodoTitle] = useState(focusedTodo.title);

    // 수정된 할일 여부
    const [isDone, setIsDone] = useState(focusedTodo.is_done);

    // 업데이트 로딩
    const [isLoading, setIsLoading] = useState(false);

    // 수정 input error
    const [editError, setEditError] = useState("");

    // 수정된 할일 객체
    const editATodo = {
      id: focusedTodo.id,
      title: editedTodoTitle,
      is_done: isDone,
    };

    const setATodoState: SetATodoStateType = (boolean, string) => {
      setIsLoading(boolean || false);
      setEditError(string || "");
    };

    // temp date edit func
    const tempDate = () => {
      const utcTimeString = "2024-01-27T04:15:40.755Z";

      const utcDate = new Date(utcTimeString);
      const koreaDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000); // UTC에서 KST로 변환

      const formattedDate = new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true, // 오전/오후 표현
        timeZoneName: "short",
      }).format(koreaDate);

      // console.log(formattedDate);
    };

    return (
      <>
        <ModalHeader className="flex flex-col gap-1">할일 수정</ModalHeader>
        <ModalBody>
          <p>
            <span className="font-bold">id : </span>
            {focusedTodo.id}
          </p>

          <Input
            autoFocus
            label="할일"
            placeholder="할일을 입력해주세요."
            variant="bordered"
            isRequired
            errorMessage={editError}
            defaultValue={focusedTodo.title}
            onValueChange={(editTodo) => {
              setEditedTodoTitle(editTodo);
              editTodo && setEditError("");
            }}
          />

          <div>
            <span className="font-bold">완료 여부 : </span>
            <Switch
              aria-label="완료 여부"
              color="warning"
              defaultSelected={focusedTodo.is_done}
              onValueChange={setIsDone}
            />
          </div>
          <p>
            <span className="font-bold">작성일 : </span>
            {focusedTodo.created_at}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            color="warning"
            variant="flat"
            isDisabled={
              focusedTodo.title === editATodo.title &&
              focusedTodo.is_done === editATodo.is_done
            }
            onPress={() => {
              onEdit(editATodo, setATodoState, onClose);
            }}
          >
            {isLoading ? <Spinner color="warning" /> : "수정"}
          </Button>
          <Button color="default" onPress={onClose}>
            닫기
          </Button>
        </ModalFooter>
      </>
    );
  };

  const deleteModal = () => {
    return (
      <>
        <ModalHeader className="flex flex-col gap-1">{modalType}</ModalHeader>
        <ModalBody>
          <p>{modalType}</p>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Close
          </Button>
          <Button color="primary" onPress={onClose}>
            Actio n
          </Button>
        </ModalFooter>
      </>
    );
  };

  const getModal = (modalType: CustomModalType) => {
    switch (modalType) {
      case "detail":
        return detailModal();
      case "edit":
        return editModal();
      case "delete":
        return deleteModal();

      default:
        break;
    }
  };
  return <>{getModal(modalType)}</>;
};
