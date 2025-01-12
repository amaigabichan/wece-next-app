import AccountWidget from "../accountwidget";
import EventCard from "../eventcard";
import styles from "../../styles/Eventbox.module.css";
import formStyles from "../../styles/Forms.module.css";

import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import MultiSelect from "react-multi-select-component";
import ScrollMenu from "react-horizontal-scrolling-menu";
import { BsFillPlusSquareFill } from "react-icons/bs";
import { HiArrowCircleLeft, HiArrowCircleRight } from "react-icons/hi";
import { MdInfoOutline } from "react-icons/md";

import { base_url } from "../../constants.js";
import { refreshAuth } from "../../apihelper.js";

const EventBox = ({
  boxTitle,
  events,
  viewMode,
  showSavedOnly,
  handleUpdate,
}) => {
  const eventsSaved = useSelector((state) => state.eventsSaved);
  const [menu, setMenu] = useState();
  const [users, setUsers] = useState([]);

  const [validated, setValidated] = useState(false);
  const [modalCreate, setModalCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [webConferenceLink, setWebConferenceLink] = useState("");
  const [actionLink, setActionLink] = useState("");
  const [hosts, setHosts] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [points, setPoints] = useState(0);
  const eventImageRef = useRef();

  const getUsers = () => {
    const usersUrl = base_url + "/users";
    axios
      .get(usersUrl, { withCredentials: true })
      .then((res) => {
        const userOptions = res.data.map((user) => ({
          label: user.firstName + " " + user.lastName,
          value: user.email,
        }));
        setUsers(userOptions);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    if (!viewMode) {
      getUsers();
    }
  }, []);

  useEffect(() => {
    const Menu = events.map((event, idx) => {
      return (
        <MenuItem
          className={styles["menu-item"]}
          event={event}
          key={`event-${idx}`}
        />
      );
    });
    setMenu(Menu);
  }, [events]);

  const infoPopover = (
    <Popover>
      <Popover.Title as="p">
        {viewMode ? "View Events" : "Manage Events"}
      </Popover.Title>
      <Popover.Content>
        {showSavedOnly
          ? "View your saved and attended events from the WECE events page."
          : "Manage events you have created."}
      </Popover.Content>
    </Popover>
  );

  const MenuItem = ({ event }) => {
    return (
      <EventCard
        id={event._id}
        title={event.title}
        startDate={event.startDate}
        endDate={event.endDate}
        recurring={event.recurring}
        description={event.description}
        location={event.location}
        webConferenceLink={event.webConferenceLink}
        actionLink={event.actionLink}
        token={event.token}
        hosts={event.hosts}
        committees={event.committees}
        attendees={event.attendees}
        points={event.points}
        eventImage={event.eventImage}
        users={users}
        onUpdate={handleUpdate}
        viewMode={viewMode}
        isSaved={eventsSaved ? eventsSaved.includes(event._id) : false}
      />
    );
  };

  const ArrowLeft = <HiArrowCircleLeft className={styles["arrow"]} />;
  const ArrowRight = <HiArrowCircleRight className={styles["arrow"]} />;

  const committeeOptions = [
    { label: "Academic", value: "academic" },
    { label: "Infrastructure", value: "infrastructure" },
    { label: "Marketing", value: "marketing" },
    { label: "Mentorship", value: "mentorship" },
    { label: "Outreach", value: "outreach" },
    { label: "Social", value: "social" },
    { label: "Technical", value: "technical" },
  ];

  const toggle = () => setModalCreate(!modalCreate);

  const reduceFormValues = (formElements) => {
    const arrElements = Array.prototype.slice.call(formElements);
    const formValues = arrElements
      .filter((elem) => elem.name.length > 0)
      .map((x) => {
        const { name, type, value } = x;
        return {
          name,
          type,
          value,
          valid: x.checkValidity(),
        };
      });
    return formValues;
  };
  const checkAllFieldsValid = (formValues) => {
    return !Object.keys(formValues)
      .map((x) => formValues[x])
      .some((field) => !field.valid);
  };

  const handleSubmit = (e) => {
    const createUrl = base_url + "/event/";

    const form = e.currentTarget;
    const formValues = reduceFormValues(form.elements);
    const allFieldsValid = checkAllFieldsValid(formValues);

    if (!allFieldsValid) {
      e.preventDefault();
      e.stopPropagation();
      setValidated(true);
    } else {
      e.preventDefault();
      setValidated(true);

      const inputs = form.querySelectorAll("input");
      inputs.forEach((input) => (input.disabled = true));

      const newEvent = {
        title: title,
        startDate: startDate ? new Date(startDate) : "",
        endDate: endDate ? new Date(endDate) : "",
        recurring: recurring,
        description: description,
        location: location,
        webConferenceLink: webConferenceLink,
        actionLink: actionLink,
        hosts: hosts ? hosts : [],
        committees: committees ? committees : [],
        points: points,
      };

      axios
        .post(createUrl, newEvent, {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        })
        .then((res) => {
          if (eventImageRef.current.files[0]) {
            const formData = new FormData();
            formData.append("eventImage", eventImageRef.current.files[0]);
            axios
              .put(base_url + "/event/" + res.data._id, formData, {
                headers: {
                  "Content-Type": "application/json",
                },
                withCredentials: true,
              })
              .then(() => {
                handleUpdate();
              })
              .catch((err) => {
                if (Object.keys(err.response.data).length > 0) {
                  console.log(err.response.data);
                }
              })
              .finally(() => {
                inputs.forEach((input) => (input.disabled = false));
                setValidated(false);
              });
          }
        })
        .catch((err) => {
          if (Object.keys(err.response.data).length > 0) {
            console.log(err.response.data);
          }
        })
        .finally(() => {
          inputs.forEach((input) => (input.disabled = false));
          setValidated(false);
          refreshAuth();
          handleUpdate();
          toggle();
        });
    }
  };

  return (
    <AccountWidget>
      <div className={styles["header"]}>
        {boxTitle != "" ? (
          <div className={styles["title"]}>
            {boxTitle}{" "}
            <OverlayTrigger placement="bottom" overlay={infoPopover}>
              <MdInfoOutline />
            </OverlayTrigger>
          </div>
        ) : (
          ""
        )}

        {!viewMode ? (
          <div className={styles["create-container"]}>
            <span className={styles["create-text"]} onClick={toggle}>
              Create New Event{" "}
              <BsFillPlusSquareFill className={styles["create-icon"]} />
            </span>
          </div>
        ) : (
          ""
        )}
      </div>
      <ScrollMenu
        data={menu}
        arrowLeft={ArrowLeft}
        arrowRight={ArrowRight}
        wheel={false}
        alignCenter={false}
        itemClass={styles["item"]}
      />
      <Modal show={modalCreate} onHide={toggle}>
        <Modal.Header closeButton>Create Event</Modal.Header>
        <Modal.Body>
          <Form
            name="edit-form"
            noValidate
            validated={validated}
            onSubmit={handleSubmit}
          >
            <Form.Group>
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Start Time</Form.Label>
              <Form.Control
                type="datetime-local"
                name="start-time"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>End Time</Form.Label>
              <Form.Control
                type="datetime-local"
                name="end-time"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Check
                type="checkbox"
                label="Recurring"
                name="recurring"
                checked={recurring}
                onChange={(_) => setRecurring(!recurring)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                name="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <Form.Text>Leave empty if virtual event.</Form.Text>
            </Form.Group>
            <Form.Group>
              <Form.Label>Web Conference Link</Form.Label>
              <Form.Control
                type="text"
                name="web-link"
                value={webConferenceLink}
                onChange={(e) => setWebConferenceLink(e.target.value)}
              />
              <Form.Text>E.g. Zoom, Google Meets, etc.</Form.Text>
            </Form.Group>
            <Form.Group>
              <Form.Label>Points</Form.Label>
              <Form.Control
                type="number"
                name="points"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Action Link</Form.Label>
              <Form.Control
                type="text"
                name="action-link"
                value={actionLink}
                onChange={(e) => setActionLink(e.target.value)}
              />
              <Form.Text>E.g. Google form, website link, etc.</Form.Text>
            </Form.Group>
            <Form.Group>
              <Form.Label>Committees</Form.Label>
              <MultiSelect
                options={committeeOptions}
                value={committees}
                onChange={setCommittees}
                labelledBy={"Select committees"}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Event Hosts</Form.Label>
              <MultiSelect
                options={users}
                value={hosts}
                onChange={setHosts}
                labelledBy={"Select hosts"}
              />
            </Form.Group>
            <Form.Group>
              <Form.Control
                type="file"
                name="event-image"
                ref={eventImageRef}
              />
            </Form.Group>
            <Button className={formStyles["submit-form"]} type="submit">
              Submit
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </AccountWidget>
  );
};

export default EventBox;
