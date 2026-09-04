import React from 'react';
import Task from './Task';

/** Dedicated list of tasks with CA approval status = sent. */
export default function SentApprovals() {
  return <Task fixedCaApproval="sent" />;
}
