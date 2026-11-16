import { useMemo, useState } from "react";
import {
  Button,
  Group,
  Modal,
  Radio,
  Select,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { similarTickets } from "@/domain/similarity";
import { createTicket } from "@/store/actions";
import { useTickets } from "@/store/useTickets";
import { SimilarTickets } from "../similar-tickets";
import { DEFAULT_IMPACT } from "./constants";
import { Impact } from "./enums";
import type { Props } from "./types";
import { impactOptions, isComplete, priorityOf, topicOptions } from "./utils";

export function NewTicketModal({ currentUser, onClose, onOpenTicket }: Props) {
  const state = useTickets();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const [impact, setImpact] = useState<Impact>(DEFAULT_IMPACT);
  const [saving, setSaving] = useState(false);

  const topics = useMemo(
    () => topicOptions(state.categories),
    [state.categories],
  );
  const tickets = useMemo(() => Object.values(state.tickets), [state.tickets]);
  const hits = useMemo(
    () => similarTickets({ title, description }, tickets),
    [title, description, tickets],
  );

  const submit = async () => {
    if (!topic || !isComplete({ title, description, topic }) || saving) return;
    setSaving(true);
    const id = await createTicket({
      requesterId: currentUser.id,
      categoryId: topic,
      priority: priorityOf(impact),
      title,
      description,
    });
    setSaving(false);
    if (id) onOpenTicket(id);
  };

  return (
    <Modal opened onClose={onClose} title="Novo chamado" size="lg">
      <Stack>
        <TextInput
          label="Resumo do problema"
          placeholder="Ex.: A VPN não liga"
          required
          data-autofocus
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
        />
        <Textarea
          label="O que está acontecendo?"
          description="Quanto mais detalhes, mais rápido conseguimos ajudar."
          required
          autosize
          minRows={3}
          maxRows={8}
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
        />
        <SimilarTickets hits={hits} onOpen={onOpenTicket} />
        <Select
          label="Sobre o quê?"
          placeholder="Escolha um assunto"
          required
          allowDeselect={false}
          data={topics}
          value={topic}
          onChange={setTopic}
        />
        <Radio.Group
          label="Quanto isso atrapalha o seu trabalho?"
          value={impact}
          onChange={(value) => setImpact(value as Impact)}
        >
          <Stack gap="xs" mt="xs">
            {impactOptions().map((option) => (
              <Radio
                key={option.value}
                value={option.value}
                label={option.label}
              />
            ))}
          </Stack>
        </Radio.Group>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            loading={saving}
            disabled={!isComplete({ title, description, topic })}
          >
            Abrir chamado
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
