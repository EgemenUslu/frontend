import React from "react";
import { Modal } from "antd";

import ContactCard from "../../../../../../Partials/ContactCards/ContactCard.jsx";
import ContactCardOnEdit from "../../../../../../Partials/ContactCards/ContactCardOnEdit.jsx";
import { axiosCaptcha } from "../../../../../../../utils/api/fetch_api";
import { getContactsRequest } from "../../../../../../../utils/api/requests.js";

class Contacts extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      contacts: [],
      isAddContactShowing: false
    };

    this.setAddContactDisplay = this.setAddContactDisplay.bind(this);
    this.addToContactsList = this.addToContactsList.bind(this);
    this.editContactsList = this.editContactsList.bind(this);
    this.deleteFromContactsList = this.deleteFromContactsList.bind(this);
  }

  componentDidMount() {
    this.getContacts();
  }

  async getContacts() {
    await this.props.handleTokenExpiration("contacts getContacts");
    const { card } = this.props;
    let { url, config } = getContactsRequest;
    url = url + "?jobapp_id=" + card.id;
    axiosCaptcha(url, config).then(response => {
      if (response.statusText === "OK") {
        this.contacts = response.data.data;
        this.setState({
          contacts: this.contacts
        });
      }
    });
  }

  addToContactsList(contact) {
    let updatedContacts = this.state.contacts;
    updatedContacts.unshift(contact);
    this.setState(
      { contacts: updatedContacts },
      console.log("added", this.state.contacts)
    );
  }

  editContactsList(editedContact) {
    let updatedContacts = this.state.contacts.filter(
      contact => contact.id != editedContact.id
    );
    updatedContacts.unshift(editedContact);
    this.setState(
      { contacts: updatedContacts },
      console.log("updated", this.state.contacts)
    );
  }

  deleteFromContactsList(contactId) {
    let updatedContacts = this.state.contacts;
    this.setState(
      { contacts: updatedContacts.filter(contact => contact.id != contactId) },
      console.log("edited", this.state.contacts)
    );
  }

  setAddContactDisplay(state) {
    this.setState({ isAddContactShowing: state });
  }

  generateContactCards() {
    return this.state.contacts.map(contact => (
      <div key={contact.id} style={{ cursor: "pointer", margin: 12 }}>
        <ContactCard
          contact={contact}
          card={this.props.card}
          handleTokenExpiration={this.props.handleTokenExpiration}
          editContactsList={this.editContactsList}
          deleteFromContactsList={this.deleteFromContactsList}
        />
      </div>
    ));
  }

  render() {
    console.log("contacts", this.state.contacts);
    return (
      <div className="contacts">
        <div className="add-contact-button-container">
          <div
            className="add-contact-button"
            onClick={() => this.setAddContactDisplay(true)}
          >
            Add Contact
          </div>
          <div>
            <Modal
              visible={this.state.isAddContactShowing}
              footer={null}
              closable={false}
              bodyStyle={{ padding: 0, margin: 0 }}
            >
              <ContactCardOnEdit
                setContactEditDisplay={this.setAddContactDisplay}
                handleTokenExpiration={this.props.handleTokenExpiration}
                addToContactsList={this.addToContactsList}
                type="add"
                card={this.props.card}
              />
            </Modal>
          </div>
        </div>

        {this.state.contacts.length == 0 ? (
          <div className="no-data" style={{ margin: 160 }}>
            You do not have any contacts yet!
          </div>
        ) : (
          <div>{this.generateContactCards()}</div>
        )}
      </div>
    );
  }
}

export default Contacts;