import React from 'react';

const ActionButtons = ({ id, JsShowMenu }) => {
  return (
    <td align="center" style={{ width: '7%', whiteSpace: 'nowrap' }}>
      <div
        className="text-align"
        style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}
      >
        <button
          onClick={() => JsShowMenu(id, 'PAYMENT')}
          title="Payment"
          className="btn btnbtn-default graybox"
          style={{ padding: '2px', cursor: 'pointer' }}
          aria-label="Payment"
        >
          <i style={{ color: 'green' }} className="fa fa-money" />
        </button>

        <span
          id="qlwapp"
          className="qlwapp qlwapp-free qlwapp-button qlwapp-bottom-right qlwapp-all qlwapp-rounded"
          style={{ display: 'inline-block' }}
        >
          <a
            className="qlwapp-toggle"
            data-action="open"
            data-phone="966500832016"
            data-message=""
            role="button"
            tabIndex={0}
            target="_blank"
            rel="noopener noreferrer"
            href="https://wa.me/966500832016"
            title="Show Hide Profile"
          >
            <div className="btn btnbtn-default graybox" style={{ padding: '2px' }}>
              <i style={{ color: 'darkgreen' }} className="fa fa-whatsapp" />
            </div>
          </a>
        </span>

        <button
          onClick={() => JsShowMenu(id, 'SHOWHIDE')}
          title="Show/Hide Profile"
          className="btn btnbtn-default graybox"
          style={{ padding: '2px', cursor: 'pointer' }}
          aria-label="Show/Hide Profile"
        >
          <i style={{ color: '#cf2037' }} className="fa fa-list-alt" />
        </button>

        <button
          onClick={() => JsShowMenu(id, 'PASSWORD')}
          title="Change Password"
          className="btn btnbtn-default graybox"
          style={{ padding: '2px', cursor: 'pointer' }}
          aria-label="Change Password"
        >
          <i style={{ color: '#cf2037' }} className="fa fa-key" />
        </button>

        <button
          onClick={() => JsShowMenu(id, 'MODIFY')}
          title="Edit/حذف"
          className="btn btnbtn-default graybox"
          style={{ padding: '2px', cursor: 'pointer' }}
          aria-label="Edit/حذف"
        >
          <i style={{ color: '#cf2037' }} className="fa fa-pencil" />
        </button>

        <button
          onClick={() => JsShowMenu(id, 'DELETE')}
          title="Delete/حذف"
          className="btn btnbtn-default graybox"
          style={{ padding: '2px', cursor: 'pointer' }}
          aria-label="Delete/حذف"
        >
          <i style={{ color: '#cf2037' }} className="fa fa-trash-o" />
        </button>

        <button
          onClick={() => JsShowMenu(id, 'TRANSFER')}
          title="Transfer/تحويل"
          className="btn btnbtn-default graybox"
          style={{ padding: '2px', cursor: 'pointer' }}
          aria-label="View"
        >
          <i style={{ color: '#cf2037' }} className="fa fa-eye" />
        </button>
      </div>
    </td>
  );
};

const ActionButtonsV1 = ({ id, JsShowMenu }) => {
  return (
    <td align="center" style={{ width: '7%', whiteSpace: 'nowrap' }}>
      <div
        className="text-align"
        style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}
      >
        <button
          onClick={() => JsShowMenu(id, 'MODIFY')}
          title="Edit/حذف"
          className="btn btnbtn-default graybox"
          style={{ padding: '2px', cursor: 'pointer' }}
          aria-label="Edit/حذف"
        >
          <i style={{ color: '#cf2037' }} className="fa fa-pencil" />
        </button>

        <button
          onClick={() => JsShowMenu(id, 'DELETE')}
          title="Delete/حذف"
          className="btn btnbtn-default graybox"
          style={{ padding: '2px', cursor: 'pointer' }}
          aria-label="Delete/حذف"
        >
          <i style={{ color: '#cf2037' }} className="fa fa-trash-o" />
        </button>

        <button
          onClick={() => JsShowMenu(id, 'VIEW')}
          title="Transfer/تحويل"
          className="btn btnbtn-default graybox"
          style={{ padding: '2px', cursor: 'pointer' }}
          aria-label="View"
        >
          <i style={{ color: '#cf2037' }} className="fa fa-eye" />
        </button>
      </div>
    </td>
  );
};

export { ActionButtons, ActionButtonsV1 };
