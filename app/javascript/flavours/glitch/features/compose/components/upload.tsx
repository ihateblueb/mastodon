import { useCallback } from 'react';

import { FormattedMessage } from 'react-intl';

import classNames from 'classnames';

import type { Map as ImmutableMap, List as ImmutableList } from 'immutable';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import CloseIcon from '@/material-icons/400-20px/close.svg?react';
import EditIcon from '@/material-icons/400-24px/edit.svg?react';
import WarningIcon from '@/material-icons/400-24px/warning.svg?react';
import { undoUploadCompose } from 'flavours/glitch/actions/compose';
import { openModal } from 'flavours/glitch/actions/modal';
import { Blurhash } from 'flavours/glitch/components/blurhash';
import { Icon } from 'flavours/glitch/components/icon';
import type { MediaAttachment } from 'flavours/glitch/models/media_attachment';
import { useAppDispatch, useAppSelector } from 'flavours/glitch/store';

const colCount = (size: number) => Math.max(Math.ceil(Math.sqrt(size)), 2);

export const Upload: React.FC<{
  id: string;
  dragging?: boolean;
  draggable?: boolean;
  overlay?: boolean;
  size?: number;
  index?: number;
}> = ({ id, dragging, draggable = true, overlay, size, index }) => {
  const dispatch = useAppDispatch();
  const media = useAppSelector((state) =>
    (
      (state.compose as ImmutableMap<string, unknown>).get(
        'media_attachments',
      ) as ImmutableList<MediaAttachment>
    ).find((item) => item.get('id') === id),
  );
  const sensitive = useAppSelector(
    (state) => state.compose.get('sensitive') as boolean,
  );

  const handleUndoClick = useCallback(() => {
    dispatch(undoUploadCompose(id));
  }, [dispatch, id]);

  const handleFocalPointClick = useCallback(() => {
    dispatch(
      openModal({ modalType: 'FOCAL_POINT', modalProps: { mediaId: id } }),
    );
  }, [dispatch, id]);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  if (!media) {
    return null;
  }

  const focusX = media.getIn(['meta', 'focus', 'x']) as number;
  const focusY = media.getIn(['meta', 'focus', 'y']) as number;
  const x = (focusX / 2 + 0.5) * 100;
  const y = (focusY / -2 + 0.5) * 100;
  const missingDescription =
    ((media.get('description') as string | undefined) ?? '').length === 0;

  let tall = false;
  let wide = false;

  if (size != null && index != null) {
    const cols = colCount(size);
    const remaining = ((-size % cols) + cols) % cols;
    const largeCount = Math.floor(remaining / 3); // width=2, height=2
    const mediumCount = remaining % 3; // height=2

    if (size === 1 || index < largeCount) {
      wide = true;
      tall = true;
    } else if (size === 2 || index < largeCount + mediumCount) {
      tall = true;
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      className={classNames('compose-form__upload media-gallery__item', {
        dragging,
        draggable,
        overlay,
        'media-gallery__item--tall': tall,
        'media-gallery__item--wide': wide,
      })}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div
        className='compose-form__upload__thumbnail'
        style={{
          backgroundImage: !sensitive
            ? `url(${media.get('preview_url') as string})`
            : undefined,
          backgroundPosition: `${x}% ${y}%`,
        }}
      >
        {sensitive && (
          <Blurhash
            hash={media.get('blurhash') as string}
            className='compose-form__upload__preview'
          />
        )}

        <div className='compose-form__upload__actions'>
          <button
            type='button'
            className='icon-button compose-form__upload__delete'
            onClick={handleUndoClick}
          >
            <Icon id='close' icon={CloseIcon} />
          </button>
          <button
            type='button'
            className='icon-button'
            onClick={handleFocalPointClick}
          >
            <Icon id='edit' icon={EditIcon} />
            {(size == null || size < 5) && (
              <>
                {' '}
                <FormattedMessage id='upload_form.edit' defaultMessage='Edit' />
              </>
            )}
          </button>
        </div>

        <div className='compose-form__upload__warning'>
          <button
            type='button'
            className={classNames('icon-button', {
              active: missingDescription,
            })}
            onClick={handleFocalPointClick}
          >
            {missingDescription && <Icon id='warning' icon={WarningIcon} />} ALT
          </button>
        </div>
      </div>
    </div>
  );
};
