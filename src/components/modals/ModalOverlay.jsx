import React from 'react';
import { useAuth } from '../../context/AuthContext';
import ExcelImportModal from './ExcelImportModal';
import SanctionGrantModal from './SanctionGrantModal';
import ScoreSheetModal from './ScoreSheetModal';
import AddApplicationModal from './AddApplicationModal';
import SendNotificationModal from './SendNotificationModal';

const ModalOverlay = () => {
  const { activeModal, closeModal } = useAuth();
  if (!activeModal) return null;

  return (
    <div className="overlay show" onClick={closeModal}>
      <div
        className={`modal-box ${activeModal === 'excelImport' || activeModal === 'scoreSheet' || activeModal === 'addApp' || activeModal === 'sendNotification' ? 'wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {activeModal === 'excelImport' && <ExcelImportModal />}
        {activeModal === 'sanctionGrant' && <SanctionGrantModal />}
        {activeModal === 'scoreSheet' && <ScoreSheetModal />}
        {activeModal === 'addApp' && <AddApplicationModal />}
        {activeModal === 'sendNotification' && <SendNotificationModal />}
      </div>
    </div>
  );
};

export default ModalOverlay;
