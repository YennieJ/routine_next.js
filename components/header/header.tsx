"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/data/axiosInstance";
import { Modal, ModalContent } from "@nextui-org/react";

import {
  useDisclosure,
  Tooltip,
  Input,
  Textarea,
  Button,
  Progress,
  Skeleton,
} from "@nextui-org/react";
import { DeleteIcon, EditIcon, PlayIcon } from "@/components/icons";

import AddHeaderForm from "./add-header-form";
import EditHeaderForm from "./edit-header-form";
import DeleteHeaderForm from "./delete-header-form";
import { FocusHeaderType, Header, HeaderModalType } from "@/types";
import { speakText, checkTimeAndSpeak } from "@/app/utils/getSpeech";

const Heaer = () => {
  // 데이터 / 모달 / 모달 데이터 / 음성 동의 / 재생 중
  const [header, setHeader] = useState({ startTime: "", description: "" });
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [currentModalData, setCurrentModalData] = useState<FocusHeaderType>({
    focusedHeader: null,
    modalType: "addHeader",
  });
  const [isConsented, setIsConsented] = useState(false);
  const [isSpeech, setIsSpeech] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const toggleConsent = () => setIsConsented(!isConsented);

  const currentTime = checkTimeAndSpeak(
    header.startTime,
    isConsented,
    header.description
  );

  useEffect(() => {
    fetchHeader();
    const consent = localStorage.getItem("voiceConsent");
    setIsConsented(consent === "true");
  }, []);

  const fetchHeader = async () => {
    setIsDataLoaded(true);
    try {
      const response = await axiosInstance.get("/api/header");
      if (response.status === 204) {
        setHeader({ startTime: "", description: "" });
      } else {
        setHeader(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch header", error);
    } finally {
      setIsDataLoaded(false);
    }
  };

  const speechHandler = () => {
    if (isSpeech) {
      return;
    }

    setIsSpeech(true);

    speakText(header.description, () => {
      setIsSpeech(false);
    });
  };

  const modalHandler = (header: Header | null, key: HeaderModalType) => {
    onOpen();
    setCurrentModalData({
      focusedHeader: header,
      modalType: key,
    });
  };

  const renderModalContent = (
    modalData: FocusHeaderType,
    onClose: () => void
  ) => {
    switch (modalData.modalType) {
      case "addHeader":
        return (
          <AddHeaderForm
            onClose={onClose}
            fetchHeader={fetchHeader}
            isConsented={isConsented}
            toggleConsent={toggleConsent}
          />
        );
      case "editHeader":
        return (
          <EditHeaderForm
            onClose={onClose}
            fetchHeader={fetchHeader}
            focusedHeader={modalData.focusedHeader!}
          />
        );
      case "deleteHeader":
        return <DeleteHeaderForm onClose={onClose} fetchHeader={fetchHeader} />;
      default:
        break;
    }
  };

  return (
    <div className="p-4 mb-4 flex flex-col justify-between gap-4 bg-content1 overflow-auto rounded-large shadow-small">
      {isDataLoaded ? (
        <Skeleton className="rounded-lg">
          <div className="h-24 rounded-lg bg-default-300"></div>
        </Skeleton>
      ) : header.description ? (
        <>
          <p className="text-2xl font-medium">현재 시간 {currentTime}</p>
          <div className="flex justify-end items-baseline gap-2">
            <Button
              color="warning"
              variant="flat"
              startContent={<PlayIcon />}
              className="w-full"
              onPress={speechHandler}
            >
              {isSpeech ? (
                <Progress
                  size="sm"
                  color="warning"
                  isIndeterminate
                  aria-label="Loading..."
                  className="w-1/6"
                />
              ) : (
                "speech"
              )}
            </Button>
            <Tooltip content="Edit Header">
              <span
                className="text-lg text-default-400 cursor-pointer active:opacity-50"
                onClick={() => {
                  modalHandler(header, "editHeader");
                }}
              >
                <EditIcon />
              </span>
            </Tooltip>
            <Tooltip color="danger" content="Delete Header">
              <span
                className="text-lg text-danger cursor-pointer active:opacity-50"
                onClick={() => {
                  modalHandler(null, "deleteHeader");
                }}
              >
                <DeleteIcon />
              </span>
            </Tooltip>
          </div>
          <Input
            type="time"
            name="time"
            label="시간"
            isReadOnly
            variant="bordered"
            value={header.startTime}
          />
          <Textarea
            type="text"
            name="header"
            label="머릿말"
            isReadOnly
            variant="bordered"
            value={header.description}
          />
        </>
      ) : (
        <Button
          type="submit"
          color="warning"
          variant="flat"
          onPress={() => modalHandler(null, "addHeader")}
        >
          머릿말 추가하기
        </Button>
      )}
      <Modal
        placement="center"
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => renderModalContent(currentModalData, onClose)}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Heaer;
