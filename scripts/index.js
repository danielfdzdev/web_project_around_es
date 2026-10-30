import Card from "../components/Card.js";
import Section from "../components/Section.js";
import PopupWithImage from "../components/PopupWithImage.js";
import PopupWithForm from "../components/PopupWithForm.js";
import UserInfo from "../components/UserInfo.js";
import { FormValidator, config } from "../components/FormValidator.js";
import Api from "../components/Api.js";
import PopupWithConfirmation from "../components/PopupWithConfirmation.js";
import NotificationToast from "../components/Notification.js";

// Buttons that open form popups. The popup classes handle closing internally.
const editProfileButton = document.querySelector(".profile__edit-button");
const addCardButton = document.querySelector(".profile__add-button");
const updateProfilePicButton = document.querySelector(".profile__image-button");

// loading section, error section and content section
// HTML/CSS define the initial state: spinner visible,
// main content hidden, and load-error hidden by default.
const spinner = document.querySelector(".spinner");
const content = document.querySelector(".content");
const loadErrorElement = document.querySelector(".load-error");

// Form validators. These control input errors and submit-button state.
const editProfileFormValidator = new FormValidator(
  config,
  "#edit-profile-form",
);
const newCardFormValidator = new FormValidator(config, "#new-card-form");
const profilePicFormValidator = new FormValidator(
  config,
  "#edit-profile-pic-form",
);
editProfileFormValidator.setEventListeners();
newCardFormValidator.setEventListeners();
profilePicFormValidator.setEventListeners();

// UserInfo reads and updates the profile text on the page.
const userInfo = new UserInfo({
  nameSelector: ".profile__title",
  descriptionSelector: ".profile__description",
  avatarSelector: ".profile__image",
});

// Getting user info from server.

const api = new Api({
  baseURL: "https://around-api.es.tripleten-services.com/v1",
  headers: {
    authorization: "243aa462-5641-4e69-8b84-d4bc9d0c9a13",
    "Content-Type": "application/json",
  },
});

// REQUESTING USER INFO AND CARDS FROM THE SERVER
api
  .getInitialCardsAndUserData()
  .then((res) => {
    const cards = res[0];
    const userData = res[1];
    // set user data and save user id
    userInfo.saveUserId(userData._id);
    userInfo.setUserInfo({
      name: userData.name,
      description: userData.about,
    });
    userInfo.setAvatar({
      avatar: userData.avatar,
    });
    // render the cards when the user id
    // is ready to be compared with the card owner
    cardSection.renderItems(cards);
    setLoadingState(false);
    setLoadErrorState(false);
  })
  .catch((err) => {
    handleRequestError(err);
    setLoadingState(false);
    setLoadErrorState(true);
  });

// Image popup. Cards will open this through the callback passed to Card.
const imagePopup = new PopupWithImage("#image-popup");
imagePopup.setEventListeners();

// delete card confirmation popup
const deleteCardPopup = new PopupWithConfirmation(
  "#remove-card-popup",
  (card) => {
    deleteCardPopup.renderDeletingState(true);

    api
      .removeCard(card.getId())
      .then((res) => {
        console.log(res);
        card.removeCardFDOM();
        deleteCardPopup.close();
      })
      .catch((err) => {
        handleRequestError(err);
        setTimeout(() => {
          deleteCardPopup.close();
        }, 100);
      })
      .finally(() => {
        deleteCardPopup.renderDeletingState(false);
      });
  },
);
deleteCardPopup.setEventListeners();

function createCard(cardData) {
  // Card receives a callback instead of importing or knowing PopupWithImage.
  // debugger;

  const card = new Card(
    cardData,
    "#card-template",
    (clickedCardData) => {
      imagePopup.open(clickedCardData);
    },
    ({ id, liked }) => {
      console.log(id, liked);
      const likeRequest = liked ? api.removeLike(id) : api.addLike(id);

      likeRequest
        .then((res) => {
          card.updateLike(res.isLiked);
        })
        .catch((err) => {
          handleRequestError(err);
        });
    },
    () => {
      deleteCardPopup.storeCardReferences(card);
      deleteCardPopup.open();
    },
  );
  return card.generateCard(userInfo.getUserId());
}

// Section renders the initial cards and adds new card elements to the page.
const cardSection = new Section(
  // renderer arrow function which will take all items and render one by one
  // forEach lives in the Section object code
  {
    renderer: (cardData) => {
      cardSection.addItem(createCard(cardData));
    },
  },
  ".cards__list",
);

const updateProfilePic = new PopupWithForm(
  "#profile-pic-popup",
  (avatarData) => {
    updateProfilePic.renderLoadingState(true);
    api
      .updateProfilePic(avatarData)
      .then((res) => {
        userInfo.setAvatar({ avatar: res.avatar });
        updateProfilePic.close();
      })
      .catch((err) => {
        handleRequestError(err);
      })
      .finally(() => {
        updateProfilePic.renderLoadingState(false);
      });
  },
);

updateProfilePic.setEventListeners();

updateProfilePicButton.addEventListener("click", () => {
  profilePicFormValidator.resetValidation();
  updateProfilePic.open();
});

// Profile form popup. PopupWithForm collects inputs and sends them here.
const editProfilePopup = new PopupWithForm("#edit-popup", (inputValues) => {
  // server expects about, so we map description → about
  // in a new object for the server
  const newValues = { name: inputValues.name, about: inputValues.description };
  editProfilePopup.renderLoadingState(true);
  api
    .patchUserInfo(newValues)
    .then((res) => {
      userInfo.setUserInfo({
        name: res.name,
        description: res.about,
      });
      editProfilePopup.close();
      editProfileFormValidator.resetValidation();
    })
    .catch((err) => {
      handleRequestError(err);
    })
    .finally(() => {
      editProfilePopup.renderLoadingState(false);
    });
});
editProfilePopup.setEventListeners();

// New-card form popup. The form input name is "place-name", so it is mapped
// to the card data shape expected by Card: { name, link }.
const newCardPopup = new PopupWithForm("#new-card-popup", (inputValues) => {
  const newCardData = {
    name: inputValues["place-name"],
    link: inputValues.link,
  };
  newCardPopup.renderLoadingState(true);

  api
    .addNewCard(newCardData)
    .then((res) => {
      cardSection.addItemToStart(createCard(res));
      newCardPopup.close();
      newCardFormValidator.resetValidation();
    })
    .catch((err) => {
      handleRequestError(err);
    })
    .finally(() => {});
});
newCardPopup.setEventListeners();

editProfileButton.addEventListener("click", () => {
  // Prefill the form with the current profile info before opening it.
  editProfilePopup.setInputValues(userInfo.getUserInfo());
  editProfileFormValidator.resetValidation();
  editProfilePopup.open();
});

addCardButton.addEventListener("click", () => {
  newCardFormValidator.resetValidation();
  newCardPopup.open();
});

const notification = new NotificationToast(".notification");
notification.setEventListeners();

function handleRequestError(err) {
  // Fetch usually rejects with a TypeError when no usable response is received.
  // Use it as a general connection-failure signal because messages vary by browser.
  if (err instanceof TypeError) {
    notification.displayErrorNotification(
      "No pudimos conectar con el servidor, revisa tu conexión e intentalo de nuevo.",
    );
  } else {
    notification.displayErrorNotification(
      "Algo salio mal, intentalo de nuevo.",
    );
  }
}

// Both helpers change main-content visibility, so their call order matters.

// Shows loading feedback while data is pending.
// Ending loading hides the spinner and reveals the main content;
// this alone does not mean the request succeeded.
function setLoadingState(isLoading) {
  if (isLoading) {
    spinner.classList.add("spinner_visible");
    content.classList.add("content_hidden");
  } else {
    spinner.classList.remove("spinner_visible");
    content.classList.remove("content_hidden");
  }
}

// The base CSS hides the error section. Its visibility modifier
// shows it instead of the main content when initial loading fails.
// Removing the modifier hides the error and restores the content.
function setLoadErrorState(hasError) {
  if (hasError) {
    loadErrorElement.classList.add("load-error_visible");
    content.classList.add("content_hidden");
  } else {
    loadErrorElement.classList.remove("load-error_visible");
    content.classList.remove("content_hidden");
  }
}
//When page loads for the first time the spinner is visible and the content hidden, we reverse
//that once we have info to show.
